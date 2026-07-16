import { Controller, Post, Param, Body, Put, Get, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PodService } from './pod.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pod')
export class PodController {
  constructor(private readonly podService: PodService) {}

  @Post('upload/:loadId')
  @RequirePermissions('pod.upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('loadId') loadId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.podService.uploadFile(file, loadId, user);
  }

  @Put(':id/approve')
  @RequirePermissions('compliance.override') // Require elevated rights for POD verification
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.podService.approve(id, user);
  }

  @Get('download/:id')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { filePath, mimeType } = await this.podService.getFilePath(id);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath);
  }
}
