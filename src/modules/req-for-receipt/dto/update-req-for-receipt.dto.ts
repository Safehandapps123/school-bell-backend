import { PartialType } from '@nestjs/swagger';
import { CreateReqForReceiptDto } from './create-req-for-receipt.dto';

export class UpdateReqForReceiptDto extends PartialType(CreateReqForReceiptDto) {}
