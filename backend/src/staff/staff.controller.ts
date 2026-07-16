import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.staffService.findAll(user);
  }

  @Post('invite')
  @RequirePermissions('staff.manage')
  invite(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.staffService.invite(dto, user);
  }

  @Put(':id/deactivate')
  @RequirePermissions('staff.manage')
  deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.staffService.setStatus(id, 'inactive', user);
  }

  @Put(':id/reactivate')
  @RequirePermissions('staff.manage')
  reactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.staffService.setStatus(id, 'active', user);
  }

  @Put(':id/role')
  @RequirePermissions('staff.manage')
  changeRole(
    @Param('id') id: string,
    @Body('role') roleName: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.staffService.changeRole(id, roleName, user);
  }

  @Delete(':id')
  @RequirePermissions('staff.manage')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.staffService.remove(id, user);
  }
}
