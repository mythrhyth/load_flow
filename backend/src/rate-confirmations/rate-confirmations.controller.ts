import { Controller, Get, Post, Patch, Delete, Body, Param, Put, UseGuards, Res } from '@nestjs/common';
import { RateConfirmationsService } from './rate-confirmations.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rate-confirmations')
export class RateConfirmationsController {
  constructor(private readonly rateConfirmationsService: RateConfirmationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.rateConfirmationsService.findAll(user);
  }

  @Post()
  @RequirePermissions('rate.confirm')
  create(@Body() dto: any, @CurrentUser() user: JwtPayload) {
    return this.rateConfirmationsService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('rate.confirm')
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rateConfirmationsService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('rate.confirm')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rateConfirmationsService.remove(id, user);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Res() res: any) {
    const { content, fileName, mimeType } = await this.rateConfirmationsService.getDownloadBuffer(id, user);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(content);
  }

  @Put(':id/approve')
  @RequirePermissions('rate.confirm')
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.rateConfirmationsService.approve(id, user);
  }
}
