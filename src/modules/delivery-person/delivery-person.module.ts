import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryPersonService } from './delivery-person.service';
import { DeliveryPersonController } from './delivery-person.controller';
import { DeliveryPerson } from './entities/delivery-person.entity';
import { FileUploadModule } from '../../common/fileUpload/file-upload.module';
import { User } from '../user/entities/user.entity';
import { PasswordService } from 'src/common/helpers/encryption/password.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryPerson ,User]),
    FileUploadModule,
  ],
  controllers: [DeliveryPersonController],
  providers: [DeliveryPersonService ,PasswordService],
  exports: [DeliveryPersonService],
})
export class DeliveryPersonModule {}
