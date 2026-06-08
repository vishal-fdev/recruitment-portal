import { Module } from '@nestjs/common';
import { MongoModelsModule } from '../mongodb/mongodb-models.module';
import { PartnerSlotsController } from './partner-slots.controller';
import { PartnerSlotsService } from './partner-slots.service';

@Module({
  imports: [
    MongoModelsModule,
  ],
  controllers: [PartnerSlotsController],
  providers: [PartnerSlotsService],
  exports: [PartnerSlotsService],
})
export class PartnerSlotsModule {}
