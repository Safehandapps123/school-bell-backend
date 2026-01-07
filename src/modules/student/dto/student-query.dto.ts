import { IsOptional, IsString, IsNumber, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Type } from 'class-transformer';

export class StudentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search keyword for name or code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ description: 'Filter by student full name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Filter by student code' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Filter by school ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  schoolId?: number;

  @ApiPropertyOptional({ description: 'Filter by parent ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({ description: 'Filter by stage' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  stage?: string;

  @ApiPropertyOptional({ description: 'Filter by class' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  class?: string;
}
