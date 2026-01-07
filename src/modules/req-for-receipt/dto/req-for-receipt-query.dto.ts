import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { HowToReceiveEnum } from '../enums/how-to-receive.enum';
import { RequestStautsEnum } from '../enums/request-status.enum';

export class ReqForReceiptQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Filter by student ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  studentId?: number;

  @ApiPropertyOptional({ description: 'Filter by delivery person ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryId?: number;

  @ApiPropertyOptional({ enum: HowToReceiveEnum, description: 'Filter by how to receive' })
  @IsOptional()
  @IsEnum(HowToReceiveEnum)
  howToReceive?: HowToReceiveEnum;

  @ApiPropertyOptional({ enum: RequestStautsEnum, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(RequestStautsEnum)
  status?: RequestStautsEnum;

  @ApiPropertyOptional({ description: 'Filter from date (ISO format)' })
  @IsOptional()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({ description: 'Filter to date (ISO format)' })
  @IsOptional()
  @Type(() => Date)
  toDate?: Date;
}
