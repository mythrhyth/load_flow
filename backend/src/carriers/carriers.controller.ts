import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CarriersService } from './carriers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Get()
  findAll() {
    return this.carriersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carriersService.findOne(id);
  }

  @Post()
  @RequirePermissions('carrier.onboard')
  create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.carriersService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('carrier.edit')
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.carriersService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('carrier.suspend')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.carriersService.remove(id, user);
  }

  @Patch(':id/compliance')
  @RequirePermissions('compliance.manage')
  updateCompliance(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.carriersService.updateCompliance(id, dto, user);
  }
}
