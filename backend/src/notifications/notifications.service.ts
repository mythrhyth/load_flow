import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: JwtPayload) {
    return this.prisma.notification.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAllRead(user: JwtPayload) {
    await this.prisma.notification.updateMany({
      where: {
        userId: user.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
    return { success: true };
  }

  async markRead(id: string, user: JwtPayload) {
    const notif = await this.prisma.notification.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!notif) {
      throw new NotFoundException(`Notification not found`);
    }

    return this.prisma.notification.update({
      where: { id: notif.id },
      data: { read: true },
    });
  }
}
