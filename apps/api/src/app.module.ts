import { Module } from '@nestjs/common';
import { CadencesController } from './cadences/cadences.controller';
import { CadencesService } from './cadences/cadences.service';
import { EnrollmentsController } from './enrollments/enrollments.controller';
import { EnrollmentsService } from './enrollments/enrollments.service';

@Module({
  controllers: [CadencesController, EnrollmentsController],
  providers: [CadencesService, EnrollmentsService],
})
export class AppModule {}