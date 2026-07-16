import { Module } from '@nestjs/common';
import { RateConfirmationsService } from './rate-confirmations.service';
import { RateConfirmationsController } from './rate-confirmations.controller';

@Module({
  controllers: [RateConfirmationsController],
  providers: [RateConfirmationsService],
  exports: [RateConfirmationsService],
})
export class RateConfirmationsModule {}
