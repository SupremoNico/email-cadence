// update-cadence.dto.ts
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CadenceStep } from '../../types';

export class UpdateEnrollmentCadenceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  steps: CadenceStep[];
}