import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email address already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create organization, default admin role, user, and userRole in a transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          type: dto.organizationType,
        },
      });

      // 2. Create default Admin Role
      const role = await tx.role.create({
        data: {
          name: 'Admin',
          description: 'Full administrative access',
          organizationId: org.id,
          isCustom: false,
        },
      });

      // 3. Connect all permissions to this Admin role
      const permissions = await tx.permission.findMany();
      for (const perm of permissions) {
        await tx.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }

      // 4. Create User
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          status: 'ACTIVE',
          organizationId: org.id,
        },
      });

      // 5. Assign Admin role to the User
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      const permissionKeys = permissions.map((p) => this.getPermissionKey(p)).filter(Boolean);

      // 6. Generate Tokens
      const tokens = await this.generateAuthTokens(user, 'Admin', permissionKeys);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
          organizationName: org.name,
          organizationType: org.type,
          role: 'Admin',
          permissions: permissionKeys,
        },
        tokens,
      };
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        organization: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status === 'INACTIVE') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Extract roles and permissions
    const userRoleNames = user.roles.map(ur => ur.role.name);
    const primaryRole = userRoleNames[0] || 'Viewer';
    const permissions = Array.from(
      new Set(user.roles.flatMap((ur) => ur.role.permissions.flatMap((rp) => {
        const key = this.getPermissionKey(rp.permission);
        return key ? [key] : [];
      }))),
    );

    // Update lastLogin
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateAuthTokens(user, primaryRole, permissions);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        organizationType: user.organization.type,
        role: primaryRole,
        permissions,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            organization: true,
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord) {
        await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = tokenRecord.user;
    const userRoleNames = user.roles.map(ur => ur.role.name);
    const primaryRole = userRoleNames[0] || 'Viewer';
    const permissions = Array.from(
      new Set(user.roles.flatMap((ur) => ur.role.permissions.flatMap((rp) => {
        const key = this.getPermissionKey(rp.permission);
        return key ? [key] : [];
      }))),
    );

    // Generate new tokens
    const tokens = await this.generateAuthTokens(user, primaryRole, permissions);

    // Delete old refresh token
    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    return tokens;
  }

  async logout(refreshToken: string) {
    try {
      await this.prisma.refreshToken.delete({ where: { token: refreshToken } });
    } catch (e) {
      // Ignore if token not found
    }
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Mock emailing password reset token
    console.log(`Password reset requested for ${email}`);
    return { success: true, message: 'Password reset link sent to your email.' };
  }

  async resetPassword(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const passwordHash = await bcrypt.hash(pass, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    return { success: true };
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

  private async generateAuthTokens(user: any, role: string, permissions: string[]) {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      role,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshTokenString = this.jwtService.sign(
      { 
        userId: user.id,
        jti: Math.random().toString(36).substring(2) + Date.now().toString()
      },
      {
        secret: process.env.REFRESH_SECRET || 'loadflow-refresh-secret-1234567890',
        expiresIn: '7d',
      },
    );

    // Clear old refresh tokens for user and save new refresh token to DB
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roleObj = user.roles[0]?.role;
    const permissions = roleObj?.permissions.flatMap((p) => {
      const key = this.getPermissionKey(p.permission);
      return key ? [key] : [];
    }) || [];

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      organizationType: user.organization.type,
      role: roleObj?.name || 'Viewer',
      permissions,
    };
  }
}
