import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class ShippersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const shippers = await this.prisma.organization.findMany({
      where: { type: 'SHIPPER', deletedAt: null },
      include: {
        loadsAsShipper: {
          where: { deletedAt: null },
        },
      },
    });

    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

    return shippers.map((s, idx) => {
      const activeLoads = s.loadsAsShipper.filter(l => l.status !== 'closed' && l.status !== 'pod-verified' && l.status !== 'delivered').length;
      const completedLoads = s.loadsAsShipper.filter(l => l.status === 'closed' || l.status === 'pod-verified' || l.status === 'delivered').length;
      const revenue = s.loadsAsShipper.reduce((acc, l) => acc + l.revenue, 0);

      // Generate initials
      const words = s.name.split(' ');
      const initials = words.map(w => w[0]).join('').slice(0, 2).toUpperCase();

      return {
        id: s.id,
        company: s.name,
        contact: 'Alex Rivera', // Seeded fallback contact
        email: `contact@${s.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`,
        phone: '+1 (312) 555-0198',
        city: 'Chicago, IL', // Fallback location
        activeLoads,
        completedLoads,
        revenue,
        lastShipment: 'Jul 15',
        status: 'active',
        initials,
        color: colors[idx % colors.length],
      };
    });
  }

  async create(dto: any, user: JwtPayload) {
    if (!dto.company) {
      throw new BadRequestException('Company name is required');
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.company,
        type: 'SHIPPER',
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });

    // Write to audit logs
    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Created shipper account',
        objectType: 'SHIPPER',
        objectId: org.id,
        newValue: JSON.stringify(org),
      },
    });

    return org;
  }

  async update(id: string, dto: any, user: JwtPayload) {
    if (!dto.company) {
      throw new BadRequestException('Company name is required');
    }

    const org = await this.prisma.organization.findFirst({
      where: { id, type: 'SHIPPER', deletedAt: null },
    });

    if (!org) {
      throw new BadRequestException('Shipper not found');
    }

    const prevValue = JSON.stringify(org);

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.company,
        updatedBy: user.userId,
      },
    });

    // Write to audit logs
    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Updated shipper account details',
        objectType: 'SHIPPER',
        objectId: id,
        previousValue: prevValue,
        newValue: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async remove(id: string, user: JwtPayload) {
    const org = await this.prisma.organization.findFirst({
      where: { id, type: 'SHIPPER', deletedAt: null },
    });

    if (!org) {
      throw new BadRequestException('Shipper not found');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: user.userId,
      },
    });

    // Write to audit logs
    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Soft deleted shipper account',
        objectType: 'SHIPPER',
        objectId: id,
        previousValue: JSON.stringify(org),
        newValue: JSON.stringify(updated),
      },
    });

    return { success: true };
  }
}
