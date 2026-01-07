import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ParentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search keyword for parent name or national ID' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Filter by full name' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Filter by national ID' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;  
}
