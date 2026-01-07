import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export class SubscriptionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'تصفية حسب حالة الاشتراك',
    enum: SubscriptionStatus,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'تصفية حسب معرف المدرسة',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  schoolId?: number;

  @ApiPropertyOptional({
    description: 'تصفية حسب معرف الخطة',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  planId?: number;
}
