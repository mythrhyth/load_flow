import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class RateConfirmationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: JwtPayload) {
    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    const where: any = {};
    if (org?.type === 'BROKER') {
      where.load = { brokerId: org.id };
    } else if (org?.type === 'CARRIER') {
      where.load = { carrierId: org.id };
    } else if (org?.type === 'SHIPPER') {
      where.load = { shipperId: org.id };
    }

    const rcs = await this.prisma.rateConfirmation.findMany({
      where,
      include: {
        load: {
          include: {
            shipper: true,
            carrier: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rcs.map(rc => ({
      id: rc.id,
      rcNumber: rc.rcNumber,
      loadId: rc.load.loadNumber,
      shipper: rc.load.shipper.name,
      carrier: rc.load.carrier?.name || 'Unassigned',
      baseRate: rc.baseRate,
      accessorial: rc.accessorialCharges,
      fuel: rc.fuelSurcharge,
      detention: rc.detentionCharges,
      total: rc.baseRate + rc.accessorialCharges + rc.fuelSurcharge + rc.detentionCharges,
      version: rc.versionNumber,
      status: rc.status.toLowerCase(), // pending, approved, void
      date: rc.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }));
  }

  async create(dto: any, user: JwtPayload) {
    if (!dto.loadId || dto.baseRate === undefined) {
      throw new BadRequestException('Load ID and base rate are required');
    }

    const load = await this.prisma.load.findFirst({
      where: {
        OR: [
          { id: dto.loadId },
          { loadNumber: dto.loadId },
        ],
      },
    });

    if (!load) {
      throw new NotFoundException(`Load ${dto.loadId} not found`);
    }

    if (load.brokerId !== user.organizationId) {
      throw new ForbiddenException('Only the brokerage can create rate confirmations for this load');
    }

    // Determine next version number
    const lastRC = await this.prisma.rateConfirmation.findFirst({
      where: { loadId: load.id },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersion = lastRC ? lastRC.versionNumber + 1 : 1;
    const rcNumber = lastRC ? lastRC.rcNumber : `RC-${1000 + Math.floor(Math.random() * 9000)}`;

    const rc = await this.prisma.rateConfirmation.create({
      data: {
        rcNumber,
        loadId: load.id,
        baseRate: dto.baseRate,
        accessorialCharges: dto.accessorial || 0.0,
        fuelSurcharge: dto.fuel || 0.0,
        detentionCharges: dto.detention || 0.0,
        notes: dto.notes || '',
        versionNumber: nextVersion,
        status: 'PENDING',
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });

    // Write to audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Created rate confirmation version',
        objectType: 'RATE_CONFIRMATION',
        objectId: rc.rcNumber,
        newValue: JSON.stringify(rc),
      },
    });

    return rc;
  }

  async approve(id: string, user: JwtPayload) {
    const rc = await this.prisma.rateConfirmation.findUnique({
      where: { id },
      include: {
        load: true,
      },
    });

    if (!rc) {
      throw new NotFoundException(`Rate confirmation ${id} not found`);
    }

    if (rc.load.brokerId !== user.organizationId && rc.load.carrierId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to approve this rate confirmation');
    }

    return this.prisma.$transaction(async (tx) => {
      // Void previous versions
      await tx.rateConfirmation.updateMany({
        where: {
          loadId: rc.loadId,
          id: { not: rc.id },
        },
        data: {
          status: 'VOID',
          updatedBy: user.userId,
        },
      });

      // Approve this version
      const approvedRC = await tx.rateConfirmation.update({
        where: { id: rc.id },
        data: {
          status: 'APPROVED',
          updatedBy: user.userId,
        },
      });

      // Update load status to rate-confirmed if currently assigned
      if (rc.load.status === 'assigned') {
        await tx.load.update({
          where: { id: rc.loadId },
          data: {
            status: 'rate-confirmed',
            updatedBy: user.userId,
          },
        });

        await tx.shipmentTimeline.create({
          data: {
            loadId: rc.loadId,
            status: 'rate-confirmed',
            userId: user.userId,
            note: `Rate confirmation ${rc.rcNumber} v${rc.versionNumber} approved. Status updated to Rate Confirmed.`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          organizationId: user.organizationId,
          action: 'Approved rate confirmation version',
          objectType: 'RATE_CONFIRMATION',
          objectId: rc.rcNumber,
          newValue: `Approved version ${rc.versionNumber}`,
        },
      });

      return approvedRC;
    });
  }

  async update(id: string, dto: any, user: JwtPayload) {
    const rc = await this.prisma.rateConfirmation.findUnique({
      where: { id },
      include: { load: true },
    });

    if (!rc) {
      throw new NotFoundException(`Rate confirmation ${id} not found`);
    }

    if (rc.load.brokerId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to edit this rate confirmation');
    }

    if (rc.status !== 'PENDING') {
      throw new BadRequestException('Only pending rate confirmations can be edited');
    }

    const prevValue = JSON.stringify(rc);

    const updated = await this.prisma.rateConfirmation.update({
      where: { id },
      data: {
        baseRate: dto.baseRate !== undefined ? parseFloat(dto.baseRate) : rc.baseRate,
        accessorialCharges: dto.accessorial !== undefined ? parseFloat(dto.accessorial) : rc.accessorialCharges,
        fuelSurcharge: dto.fuel !== undefined ? parseFloat(dto.fuel) : rc.fuelSurcharge,
        detentionCharges: dto.detention !== undefined ? parseFloat(dto.detention) : rc.detentionCharges,
        notes: dto.notes !== undefined ? dto.notes : rc.notes,
        updatedBy: user.userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Updated rate confirmation version details',
        objectType: 'RATE_CONFIRMATION',
        objectId: rc.rcNumber,
        previousValue,
        newValue: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async remove(id: string, user: JwtPayload) {
    const rc = await this.prisma.rateConfirmation.findUnique({
      where: { id },
      include: { load: true },
    });

    if (!rc) {
      throw new NotFoundException(`Rate confirmation ${id} not found`);
    }

    if (rc.load.brokerId !== user.organizationId) {
      throw new ForbiddenException('You do not have access to delete this rate confirmation');
    }

    if (rc.status === 'APPROVED') {
      throw new BadRequestException('Approved rate confirmations cannot be deleted');
    }

    await this.prisma.rateConfirmation.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Deleted rate confirmation version',
        objectType: 'RATE_CONFIRMATION',
        objectId: rc.rcNumber,
        previousValue: JSON.stringify(rc),
      },
    });

    return { success: true };
  }

  async getDownloadBuffer(id: string, user: JwtPayload) {
    const rc = await this.prisma.rateConfirmation.findUnique({
      where: { id },
      include: {
        load: {
          include: {
            shipper: true,
            carrier: true,
          },
        },
      },
    });

    if (!rc) {
      throw new NotFoundException(`Rate confirmation ${id} not found`);
    }

    const total = rc.baseRate + rc.accessorialCharges + rc.fuelSurcharge + rc.detentionCharges;

    const content = `
=========================================
          RATE CONFIRMATION
=========================================
RC Number: ${rc.rcNumber}
Version: v${rc.versionNumber}
Date: ${rc.createdAt.toLocaleDateString()}
Status: ${rc.status}

LOAD DETAILS:
Load Number: ${rc.load.loadNumber}
Shipper: ${rc.load.shipper.name}
Carrier: ${rc.load.carrier?.name || 'Unassigned'}
Origin: ${rc.load.origin}
Destination: ${rc.load.destination}
Commodity: ${rc.load.commodity}
Equipment: ${rc.load.equipment}

CHARGES (INR):
Base Rate: INR ${rc.baseRate.toLocaleString()}
Accessorial Charges: INR ${rc.accessorialCharges.toLocaleString()}
Fuel Surcharge: INR ${rc.fuelSurcharge.toLocaleString()}
Detention Charges: INR ${rc.detentionCharges.toLocaleString()}
-----------------------------------------
TOTAL RATE: INR ${total.toLocaleString()}
=========================================
Notes: ${rc.notes || 'None'}
    `;

    return {
      content: Buffer.from(content, 'utf-8'),
      fileName: `${rc.rcNumber}_v${rc.versionNumber}.txt`,
      mimeType: 'text/plain',
    };
  }
}
