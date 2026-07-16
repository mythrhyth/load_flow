import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class CarriersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const carriers = await this.prisma.organization.findMany({
      where: { type: 'CARRIER', deletedAt: null },
      include: { compliance: true },
    });

    return carriers.map(c => ({
      id: c.id,
      name: c.name,
      score: c.compliance?.complianceScore ?? 100.0,
      compliance: c.compliance?.authorityStatus === 'ACTIVE' && 
                  (!c.compliance.insuranceExpiry || new Date(c.compliance.insuranceExpiry) > new Date()) 
                  ? 'compliant' : (c.compliance?.authorityStatus === 'INACTIVE' ? 'expired' : 'warning'),
      dot: c.compliance?.dotNumber || '—',
      mc: c.compliance?.mcNumber || '—',
      insurance: c.compliance?.insuranceExpiry 
                  ? c.compliance.insuranceExpiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                  : '—',
      authority: c.compliance?.authorityStatus?.toLowerCase() || 'pending',
      risk: c.compliance?.riskScore && c.compliance.riskScore > 50 ? 'high' : (c.compliance?.riskScore && c.compliance.riskScore > 20 ? 'medium' : 'low'),
      equipment: ['Dry Van', 'Reefer', 'Flatbed'], // Default compatibility equipment
    }));
  }

  async findOne(id: string) {
    const carrier = await this.prisma.organization.findFirst({
      where: { id, type: 'CARRIER', deletedAt: null },
      include: {
        compliance: true,
        loadsAsCarrier: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!carrier) {
      throw new NotFoundException(`Carrier ${id} not found`);
    }

    return carrier;
  }

  async updateCompliance(id: string, dto: any, user: JwtPayload) {
    const carrier = await this.prisma.organization.findFirst({
      where: { id, type: 'CARRIER', deletedAt: null },
      include: { compliance: true },
    });

    if (!carrier) {
      throw new NotFoundException(`Carrier ${id} not found`);
    }

    const prevValue = JSON.stringify(carrier.compliance);

    const updateData: any = {
      updatedBy: user.userId,
    };

    if (dto.insuranceExpiry) updateData.insuranceExpiry = new Date(dto.insuranceExpiry);
    if (dto.authorityStatus) updateData.authorityStatus = dto.authorityStatus;
    if (dto.mcNumber) updateData.mcNumber = dto.mcNumber;
    if (dto.dotNumber) updateData.dotNumber = dto.dotNumber;
    if (dto.riskScore !== undefined) updateData.riskScore = dto.riskScore;
    if (dto.complianceScore !== undefined) updateData.complianceScore = dto.complianceScore;

    const compliance = await this.prisma.carrierCompliance.upsert({
      where: { carrierId: carrier.id },
      update: updateData,
      create: {
        carrierId: carrier.id,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
        authorityStatus: dto.authorityStatus || 'PENDING',
        mcNumber: dto.mcNumber || null,
        dotNumber: dto.dotNumber || null,
        riskScore: dto.riskScore ?? 0.0,
        complianceScore: dto.complianceScore ?? 100.0,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });

    // Write to audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Updated carrier compliance',
        objectType: 'CARRIER_COMPLIANCE',
        objectId: carrier.id,
        previousValue: prevValue,
        newValue: JSON.stringify(compliance),
      },
    });

    return compliance;
  }

  async create(dto: any, user: JwtPayload) {
    if (!dto.name) {
      throw new Error('Carrier name is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          type: 'CARRIER',
          createdBy: user.userId,
          updatedBy: user.userId,
        },
      });

      // 2. Create default Compliance Record
      const compliance = await tx.carrierCompliance.create({
        data: {
          carrierId: org.id,
          insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year expiry
          authorityStatus: dto.authorityStatus || 'ACTIVE',
          mcNumber: dto.mc || dto.mcNumber || `MC-${100000 + Math.floor(Math.random() * 900000)}`,
          dotNumber: dto.dot || dto.dotNumber || `DOT-${100000 + Math.floor(Math.random() * 900000)}`,
          riskScore: dto.riskScore !== undefined ? parseFloat(dto.riskScore) : 10.0,
          complianceScore: dto.complianceScore !== undefined ? parseFloat(dto.complianceScore) : 100.0,
          createdBy: user.userId,
          updatedBy: user.userId,
        },
      });

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          organizationId: user.organizationId,
          action: 'Created carrier account',
          objectType: 'CARRIER',
          objectId: org.id,
          newValue: JSON.stringify({ org, compliance }),
        },
      });

      return {
        ...org,
        compliance,
      };
    });
  }

  async update(id: string, dto: any, user: JwtPayload) {
    const carrier = await this.prisma.organization.findFirst({
      where: { id, type: 'CARRIER', deletedAt: null },
    });

    if (!carrier) {
      throw new NotFoundException(`Carrier ${id} not found`);
    }

    const prevValue = JSON.stringify(carrier);

    return this.prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
        where: { id },
        data: {
          name: dto.name,
          updatedBy: user.userId,
        },
      });

      // Also update compliance values if supplied
      let updatedCompliance: any = null;
      const compExists = await tx.carrierCompliance.findUnique({ where: { carrierId: id } });
      if (compExists) {
        const complianceUpdate: any = { updatedBy: user.userId };
        if (dto.dot || dto.dotNumber) complianceUpdate.dotNumber = dto.dot || dto.dotNumber;
        if (dto.mc || dto.mcNumber) complianceUpdate.mcNumber = dto.mc || dto.mcNumber;
        if (dto.insuranceExpiry) complianceUpdate.insuranceExpiry = new Date(dto.insuranceExpiry);
        if (dto.authorityStatus) complianceUpdate.authorityStatus = dto.authorityStatus;

        updatedCompliance = await tx.carrierCompliance.update({
          where: { carrierId: id },
          data: complianceUpdate,
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          organizationId: user.organizationId,
          action: 'Updated carrier details',
          objectType: 'CARRIER',
          objectId: id,
          previousValue: prevValue,
          newValue: JSON.stringify({ updatedOrg, updatedCompliance }),
        },
      });

      return {
        ...updatedOrg,
        compliance: updatedCompliance,
      };
    });
  }

  async remove(id: string, user: JwtPayload) {
    const carrier = await this.prisma.organization.findFirst({
      where: { id, type: 'CARRIER', deletedAt: null },
    });

    if (!carrier) {
      throw new NotFoundException(`Carrier ${id} not found`);
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: user.userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Soft deleted carrier',
        objectType: 'CARRIER',
        objectId: id,
        previousValue: JSON.stringify(carrier),
        newValue: JSON.stringify(updated),
      },
    });

    return { success: true };
  }
}
