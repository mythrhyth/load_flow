import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LoadsModule } from './loads/loads.module';
import { CarriersModule } from './carriers/carriers.module';
import { ShippersModule } from './shippers/shippers.module';
import { StaffModule } from './staff/staff.module';
import { RolesModule } from './roles/roles.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RateConfirmationsModule } from './rate-confirmations/rate-confirmations.module';
import { PodModule } from './pod/pod.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LoadsModule,
    CarriersModule,
    ShippersModule,
    StaffModule,
    RolesModule,
    AuditModule,
    NotificationsModule,
    RateConfirmationsModule,
    PodModule,
    DashboardModule,
    ReportsModule,
    SearchModule,
  ],
})
export class AppModule {}
