import { ApiProperty } from '@nestjs/swagger';
import { RequestStautsEnum } from '../enums/request-status.enum';
import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

export class UpdateRequestStatusDto {
  @ApiProperty({
    enum: RequestStautsEnum,
    example: RequestStautsEnum.APPROVED,
    description: 'Status of the receipt request',
  })
  @IsNotEmpty()
  @IsEnum(RequestStautsEnum)
  status: RequestStautsEnum;

  @ApiProperty({
    example: 'Reason for cancellation',
    description: 'Cancellation reason (required if status is CANCELD)',
    required: false,
  })
  @IsOptional()
  cancellationReason?: string;
}
