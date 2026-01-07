import { IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Type } from 'class-transformer';

export class DeliveryPersonQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search keyword for name or national ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ description: 'Filter by full name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Filter by national ID' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;
}
