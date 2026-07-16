import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: JwtPayload) {
    const staff = await this.prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    return staff.map((s, idx) => {
      const roleName = s.roles[0]?.role.name || 'Viewer';
      const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        role: roleName,
        department: roleName === 'Admin' ? 'Operations' : (roleName === 'Dispatcher' ? 'Dispatch' : 'Compliance'),
        status: s.status.toLowerCase(), // active, inactive, pending
        lastLogin: s.lastLogin ? s.lastLogin.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
        mfa: s.mfaEnabled,
        initials,
        color: colors[idx % colors.length],
        loadsHandled: 0,
        joinDate: s.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
    });
  }

  async invite(dto: any, user: JwtPayload) {
    if (!dto.email || !dto.role) {
      throw new BadRequestException('Email and Role are required');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new BadRequestException('User already registered or invited');
    }

    // Find role in this organization
    const role = await this.prisma.role.findFirst({
      where: {
        name: dto.role,
        organizationId: user.organizationId,
      },
    });

    if (!role) {
      throw new NotFoundException(`Role '${dto.role}' not found in this organization`);
    }

    const invitationToken = `invite_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const passwordHash = await bcrypt.hash('tempPass123!', 10); // default password

    return this.prisma.$transaction(async (tx) => {
      // Create user as pending
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.email.split('@')[0],
          status: 'PENDING',
          organizationId: user.organizationId,
          createdBy: user.userId,
          updatedBy: user.userId,
        },
      });

      // Assign role
      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: role.id,
        },
      });

      // Create Invitation
      const invitation = await tx.invitation.create({
        data: {
          email: dto.email.toLowerCase(),
          roleId: role.id,
          organizationId: user.organizationId,
          token: invitationToken,
          status: 'PENDING',
          createdBy: user.userId,
          updatedBy: user.userId,
        },
      });

      // Log audit
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          organizationId: user.organizationId,
          action: 'Invited staff member',
          objectType: 'USER',
          objectId: newUser.email,
          newValue: JSON.stringify(invitation),
        },
      });

      return {
        id: newUser.id,
        email: newUser.email,
        role: role.name,
        status: 'pending',
        token: invitationToken,
      };
    });
  }

  async setStatus(id: string, status: 'active' | 'inactive', user: JwtPayload) {
    const staff = await this.prisma.user.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!staff) {
      throw new NotFoundException(`Staff member not found`);
    }

    if (staff.id === user.userId) {
      throw new BadRequestException('Cannot change your own status');
    }

    const updated = await this.prisma.user.update({
      where: { id: staff.id },
      data: {
        status: status.toUpperCase(),
        updatedBy: user.userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: `${status === 'active' ? 'Reactivated' : 'Deactivated'} staff account`,
        objectType: 'USER',
        objectId: staff.email,
        newValue: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async changeRole(id: string, roleName: string, user: JwtPayload) {
    const staff = await this.prisma.user.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const role = await this.prisma.role.findFirst({
      where: { name: roleName, organizationId: user.organizationId },
    });

    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete old roles
      await tx.userRole.deleteMany({
        where: { userId: staff.id },
      });

      // Create new role
      const mapping = await tx.userRole.create({
        data: {
          userId: staff.id,
          roleId: role.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          organizationId: user.organizationId,
          action: 'Changed user role',
          objectType: 'USER',
          objectId: staff.email,
          newValue: `Changed role to ${roleName}`,
        },
      });

      return mapping;
    });
  }

  async remove(id: string, user: JwtPayload) {
    const staff = await this.prisma.user.findFirst({
      where: { id, organizationId: user.organizationId, deletedAt: null },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    if (staff.id === user.userId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Soft deleted staff member',
        objectType: 'USER',
        objectId: staff.email,
        previousValue: JSON.stringify(staff),
      },
    });

    return { success: true };
  }
}
