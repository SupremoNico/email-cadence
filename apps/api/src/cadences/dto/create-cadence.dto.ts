// apps/api/src/cadences/dto/create-cadence.dto.ts
import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CadenceStep } from '../../types';

export class CreateCadenceDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  steps: CadenceStep[];
}