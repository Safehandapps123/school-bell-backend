import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class SubscribePlanDto {
  @ApiProperty({
    description: 'معرف الخطة',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  planId: number;

  @ApiProperty({
    description: 'طريقة الدفع',
    example: 'credit_card',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
