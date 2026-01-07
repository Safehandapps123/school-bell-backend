import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { Student } from './entities/student.entity';
import { FileUploadModule } from '../../common/fileUpload/file-upload.module';
import { Parent } from '../user/entities/parent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student ,Parent]),
    FileUploadModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
