import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res } from '@nestjs/common';
import { LoadsService } from './loads.service';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('loads')
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) {}

  @Post()
  @RequirePermissions('load.create')
  create(@Body() dto: CreateLoadDto, @CurrentUser() user: JwtPayload) {
    return this.loadsService.create(dto, user);
  }

  @Post('ai-parse')
  @RequirePermissions('load.create')
  aiParse(@Body('text') text: string) {
    return this.loadsService.aiParse(text);
  }

  @Get(':id/download-summary')
  async downloadSummary(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Res() res: any) {
    const { content, fileName, mimeType } = await this.loadsService.getDownloadSummary(id, user);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(content);
  }

  @Get()
  findAll(@Query() query: any, @CurrentUser() user: JwtPayload) {
    return this.loadsService.findAll(user, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.loadsService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('load.edit')
  update(@Param('id') id: string, @Body() dto: UpdateLoadDto, @CurrentUser() user: JwtPayload) {
    return this.loadsService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('load.delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.loadsService.remove(id, user);
  }
}
