import { Module } from '@nestjs/common';
import { PodService } from './pod.service';
import { PodController } from './pod.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  ],
  controllers: [PodController],
  providers: [PodService],
  exports: [PodService],
})
export class PodModule {}
