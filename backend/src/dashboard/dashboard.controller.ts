import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getStats(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getStats(user);
  }
}
