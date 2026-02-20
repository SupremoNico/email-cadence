import { Controller, Post, Get, Param, Body, NotFoundException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentCadenceDto } from './dto/update-cadence.dto';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() dto: CreateEnrollmentDto) {
    return this.service.create(dto);
  }

  @Get(':workflowId')
  async get(@Param('workflowId') workflowId: string) {
    const enrollment = await this.service.get(workflowId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  @Post(':workflowId/update-cadence')
  updateCadence(@Param('workflowId') workflowId: string, @Body() dto: UpdateEnrollmentCadenceDto) {
    return this.service.updateCadence(workflowId, dto);
  }
}