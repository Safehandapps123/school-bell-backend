import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { HowToReceiveEnum } from '../enums/how-to-receive.enum';
import { DeliveryPersonEnum } from '../enums/delivery-person.enum';

export class CreateReqForReceiptDto {
  @ApiProperty({ example: 1, description: 'Student ID' })
  @IsOptional()
  @IsNumber()
  studentId?: number;

  @ApiProperty({ example: 'Need receipt for school activities', description: 'Reason for the receipt request', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestReason?: string;

  @ApiProperty({ example: '2025-11-10T10:00:00Z', description: 'Receipt date and time' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ enum: HowToReceiveEnum, example: HowToReceiveEnum.CAR, description: 'How to receive the student' })
  @IsNotEmpty()
  @IsEnum(HowToReceiveEnum)
  howToReceive: HowToReceiveEnum;

  @ApiProperty({ enum: DeliveryPersonEnum, example: DeliveryPersonEnum.PARENT, description: 'parent or delivery_person' })
  @IsNotEmpty()
  @IsEnum(DeliveryPersonEnum)
  deliveryPersonType :DeliveryPersonEnum;

  @ApiProperty({ example: 'ABC-123', description: 'Car number (required if howToReceive is CAR)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numberOfCar?: string;

  @ApiProperty({ example: 'Main entrance gate', description: 'Pickup location', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ example: 1, description: 'Delivery person ID (required if howToReceive is PERSON)', required: false })
  @IsOptional()
  @IsNumber()
  deliveryId?: number;
}
