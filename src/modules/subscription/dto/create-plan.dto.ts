import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({
    description: 'اسم الخطة',
    example: 'الخطة الأساسية',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'وصف الخطة',
    example: 'خطة مناسبة للمدارس الصغيرة',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'سعر الخطة',
    example: 99.99,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'مدة الخطة بالأيام',
    example: 30,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'الحد الأقصى لعدد الطلاب',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxStudents?: number;

  @ApiProperty({
    description: 'الحد الأقصى لعدد موظفي التوصيل',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDeliveryPersons?: number;

  @ApiProperty({
    description: 'مميزات الخطة',
    example: ['إشعارات غير محدودة', 'تقارير متقدمة', 'دعم فني 24/7'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({
    description: 'حالة الخطة (نشطة أم لا)',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
