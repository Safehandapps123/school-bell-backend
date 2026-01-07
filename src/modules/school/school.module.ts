import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { School } from './entities/school.entity';
import { Student } from '../student/entities/student.entity';
import { Parent } from '../user/entities/parent.entity';
import { DeliveryPerson } from '../delivery-person/entities/delivery-person.entity';
import { ReqForReceipt } from '../req-for-receipt/entities/req-for-receipt.entity';
import { FileUploadModule } from '../../common/fileUpload/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([School, Student, Parent, DeliveryPerson, ReqForReceipt]),
    FileUploadModule,
  ],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
