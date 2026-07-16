import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ShippersService } from './shippers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shippers')
export class ShippersController {
  constructor(private readonly shippersService: ShippersService) {}

  @Get()
  findAll() {
    return this.shippersService.findAll();
  }

  @Post()
  @RequirePermissions('load.create')
  create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.shippersService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('load.create')
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.shippersService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('load.create')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.shippersService.remove(id, user);
  }
}
