// apps/api/src/cadences/cadences.service.ts
import { Injectable } from '@nestjs/common';
import { Cadence, CadenceStep } from '../types';
import { CreateCadenceDto } from './dto/create-cadence.dto';

@Injectable()
export class CadencesService {
  private cadences: Record<string, Cadence> = {};

  create(dto: CreateCadenceDto): Cadence {
    const cadence: Cadence = {
      id: dto.id,
      name: dto.name,
      steps: dto.steps,
    };
    this.cadences[dto.id] = cadence;
    return cadence;
  }

  findAll(): Cadence[] {
    return Object.values(this.cadences);
  }

  get(id: string): Cadence | undefined {
    return this.cadences[id];
  }

  update(id: string, steps?: CadenceStep[], name?: string): Cadence | null {
    const cadence = this.cadences[id];
    if (!cadence) return null;
    if (steps) cadence.steps = steps;
    if (name) cadence.name = name;
    return cadence;
  }

  delete(id: string): boolean {
    if (!this.cadences[id]) return false;
    delete this.cadences[id];
    return true;
  }
}
