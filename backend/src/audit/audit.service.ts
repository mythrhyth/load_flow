import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: JwtPayload) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
    });

    const colors = ['#4F46E5', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

    return logs.map((l, idx) => {
      const initials = l.user.name.split(' ').map(w => w[0]).join('').toUpperCase();
      // Calculate human readable relative time
      const diffMs = Date.now() - new Date(l.timestamp).getTime();
      const diffMins = Math.floor(diffMs / 1000 / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeStr = 'Just now';
      if (diffDays > 0) {
        timeStr = `${diffDays}d ago`;
      } else if (diffHours > 0) {
        timeStr = `${diffHours}h ago`;
      } else if (diffMins > 0) {
        timeStr = `${diffMins}m ago`;
      }

      return {
        id: l.id,
        user: l.user.name,
        avatar: initials,
        org: user.organizationId === l.organizationId ? 'My Organization' : 'External Org',
        action: l.action,
        object: l.objectId,
        detail: l.newValue || l.previousValue || '',
        time: timeStr,
        ip: l.ipAddress || '127.0.0.1',
        color: colors[idx % colors.length],
      };
    });
  }

  async log(data: {
    userId: string;
    organizationId: string;
    action: string;
    objectType: string;
    objectId: string;
    previousValue?: string;
    newValue?: string;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        action: data.action,
        objectType: data.objectType,
        objectId: data.objectId,
        previousValue: data.previousValue,
        newValue: data.newValue,
        ipAddress: data.ipAddress,
      },
    });
  }
}
