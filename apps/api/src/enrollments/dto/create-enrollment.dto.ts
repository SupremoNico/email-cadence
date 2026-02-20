// create-enrollment.dto.ts
import { IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  cadenceId: string;

  @IsString()
  contactEmail: string;
}
