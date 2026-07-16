import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: JwtPayload) {
    const roles = await this.prisma.role.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: true,
      },
    });

    const colors = ['#EF4444', '#4F46E5', '#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#6B7280'];

    return roles.map((r, idx) => ({
      id: r.id,
      name: r.name,
      description: r.description || 'No description provided',
      users: r.users.length,
      color: colors[idx % colors.length],
      permissions: r.permissions.map((p) => this.getPermissionKey(p.permission)),
    }));
  }

  async findPermissions() {
    const permissions = await this.prisma.permission.findMany();
    // Group permissions by categories
    const categories: Record<string, any[]> = {
      'Load Management': [],
      'Rate Confirmations': [],
      'Carrier Management': [],
      'Compliance': [],
      'Reporting': [],
      'Administration': [],
    };

    for (const p of permissions) {
      const category = p.name.startsWith('load.') ? 'Load Management' :
                       p.name.startsWith('rate.') || p.name.startsWith('rc.') ? 'Rate Confirmations' :
                       p.name.startsWith('carrier.') ? 'Carrier Management' :
                       p.name.startsWith('compliance.') ? 'Compliance' :
                       p.name.startsWith('reports.') ? 'Reporting' : 'Administration';

      const permissionKey = this.getPermissionKey(p);
      categories[category].push({
        id: permissionKey,
        name: p.description || permissionKey,
        desc: p.description || permissionKey,
      });
    }

    return categories;
  }

  private getPermissionKey(permission: { name?: string | null; id?: string | null; description?: string | null }) {
    const rawName = typeof permission?.name === 'string' ? permission.name.trim() : '';
    const rawId = typeof permission?.id === 'string' ? permission.id.trim() : '';
    const rawDescription = typeof permission?.description === 'string' ? permission.description.trim() : '';

    const legacyMap: Record<string, string> = {
      'create loads': 'load.create',
      'edit loads': 'load.edit',
      'delete loads': 'load.delete',
      'assign carriers': 'load.assign',
      'dispatch loads': 'load.dispatch',
      'close loads': 'load.close',
      'update load status': 'load.update.status',
      'confirm rates': 'rate.confirm',
      'view compliance': 'compliance.view',
      'manage compliance': 'compliance.manage',
      'override compliance': 'compliance.override',
      'upload pod': 'pod.upload',
      'manage staff': 'staff.manage',
      'manage roles': 'role.manage',
      'view audit logs': 'audit.view',
      'view reports': 'reports.view',
    };

    const candidate = [rawName, rawId, rawDescription].find((value) => !!value);
    const normalized = candidate?.toLowerCase().replace(/\s+/g, ' ').trim() || '';

    if (normalized && legacyMap[normalized]) {
      return legacyMap[normalized];
    }

    if (rawName && /[a-z0-9]+(?:\.[a-z0-9]+)+/i.test(rawName)) {
      return rawName;
    }

    if (rawId && /[a-z0-9]+(?:\.[a-z0-9]+)+/i.test(rawId)) {
      return rawId;
    }

    return rawName || rawId || '';
  }

  async create(dto: any, user: JwtPayload) {
    if (!dto.name || !dto.permissions) {
      throw new BadRequestException('Role name and permissions list are required');
    }

    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: dto.name,
          description: dto.description || '',
          organizationId: user.organizationId,
          isCustom: true,
        },
      });

      for (const pName of dto.permissions) {
        const perm = await tx.permission.findFirst({
          where: { OR: [{ name: pName }, { id: pName }] },
        });
        if (perm) {
          await tx.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: perm.id,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          organizationId: user.organizationId,
          action: 'Created custom role',
          objectType: 'ROLE',
          objectId: role.name,
          newValue: JSON.stringify(role),
        },
      });

      return role;
    });
  }

  async updatePermissions(roleId: string, dto: any, user: JwtPayload) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId: user.organizationId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Clear existing
      await tx.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      // Insert new
      for (const pName of dto.permissions) {
        const perm = await tx.permission.findFirst({
          where: { OR: [{ name: pName }, { id: pName }] },
        });
        if (perm) {
          await tx.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: perm.id,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          organizationId: user.organizationId,
          action: 'Updated role permissions',
          objectType: 'ROLE',
          objectId: role.name,
          newValue: `Permissions updated: ${dto.permissions.join(', ')}`,
        },
      });

      return { success: true };
    });
  }

  async remove(id: string, user: JwtPayload) {
    const role = await this.prisma.role.findFirst({
      where: { id, organizationId: user.organizationId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (!role.isCustom) {
      throw new BadRequestException('Built-in roles cannot be deleted');
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete relations first
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.userRole.deleteMany({ where: { roleId: id } });
      await tx.invitation.deleteMany({ where: { roleId: id } });

      // Delete role
      await tx.role.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          organizationId: user.organizationId,
          action: 'Deleted custom role',
          objectType: 'ROLE',
          objectId: role.name,
          previousValue: JSON.stringify(role),
        },
      });

      return { success: true };
    });
  }
}
