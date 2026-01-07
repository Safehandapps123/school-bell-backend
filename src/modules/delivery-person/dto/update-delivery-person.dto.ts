import { PartialType } from '@nestjs/swagger';
import { CreateDeliveryPersonDto } from './create-delivery-person.dto';

export class UpdateDeliveryPersonDto extends PartialType(CreateDeliveryPersonDto) {}
