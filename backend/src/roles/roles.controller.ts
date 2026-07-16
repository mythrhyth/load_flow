import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.rolesService.findAll(user);
  }

  @Get('permissions')
  findPermissions() {
    return this.rolesService.findPermissions();
  }

  @Post()
  @RequirePermissions('role.manage')
  create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.rolesService.create(dto, user);
  }

  @Put(':id/permissions')
  @RequirePermissions('role.manage')
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rolesService.updatePermissions(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('role.manage')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rolesService.remove(id, user);
  }
}
