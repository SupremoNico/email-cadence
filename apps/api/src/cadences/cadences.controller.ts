// apps/api/src/cadences/cadences.controller.ts
import { Controller, Post, Get, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { CadencesService } from './cadences.service';
import { CreateCadenceDto } from './dto/create-cadence.dto';
import { CadenceStep } from '../types';

@Controller('cadences')
export class CadencesController {
  constructor(private readonly service: CadencesService) {}

  @Post()
  create(@Body() dto: CreateCadenceDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const cadence = this.service.get(id);
    if (!cadence) throw new NotFoundException('Cadence not found');
    return cadence;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { steps?: CadenceStep[]; name?: string }) {
    const { steps, name } = body;
    const cadence = this.service.update(id, steps, name);
    if (!cadence) throw new NotFoundException('Cadence not found');
    return cadence;
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    const deleted = this.service.delete(id);
    if (!deleted) throw new NotFoundException('Cadence not found');
    return { success: true };
  }
}
