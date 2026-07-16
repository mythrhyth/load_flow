import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Appended by JwtAuthGuard

    if (!user || !user.permissions) {
      return false;
    }

    const permissionAliases: Record<string, string[]> = {
      'load.edit': ['load.update.status'],
      'load.update.status': ['load.edit'],
    };

    // Check if user has all the required permissions, including aliases for legacy or role-specific names
    return requiredPermissions.every((permission) => {
      const aliases = permissionAliases[permission] || [];
      return user.permissions.some((userPermission: string) =>
        userPermission === permission || aliases.includes(userPermission),
      );
    });
  }
}
