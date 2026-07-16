import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @RequirePermissions('reports.view')
  getReports(@Query() query: any, @CurrentUser() user: JwtPayload) {
    return this.reportsService.getReports(user, query);
  }
}
