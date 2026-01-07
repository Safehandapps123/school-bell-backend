import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { Student } from './entities/student.entity';
import { PaginationService } from '../../common/utils/pagination.utils';
import { FileUploadService } from '../../common/fileUpload/file-upload.service';
import { User } from '../user/entities/user.entity';
import { Parent } from '../user/entities/parent.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async formatedResponse(student: Student) {
    return {
      id: student.id,
      fullName: student.fullName,
      profileImage: student?.profileImage,
      dateOfBirth: student?.dateOfBirth,
      stage: student?.stage,
      class: student?.class,
      code: student?.code,
      parent: {
        id: student?.parentId,
        fullName: student?.parent?.fullName,
        phoneNumber: student?.parent?.user?.phoneNumber,
        email: student?.parent?.user?.email,
        profileImage: student?.parent?.profileImage,
      },
      school: {
        id: student?.school?.id,
        name: student?.school?.name,
        logo: student?.school?.logo,
        location: student?.school?.location,
      },
    };
  }

  async create(
    createStudentDto: CreateStudentDto,
    user: User,
    profileImage?: Express.Multer.File,
  ): Promise<Student> {
    // Check if student code already exists
    const existingStudent = await this.studentRepository.findOne({
      where: { code: createStudentDto.code },
    });

    if (existingStudent) {
      throw new ConflictException(
        `Student with code ${createStudentDto.code} already exists`,
      );
    }

    let savedProfileImage: any = undefined;
    if (profileImage) {
      savedProfileImage =
        await this.fileUploadService.uploadImage(profileImage);
    }

    const student = this.studentRepository.create({
      ...createStudentDto,
      parentId: user.parentId,
      schoolId: user.schoolId,
      profileImage: savedProfileImage || createStudentDto.profileImage,
    });

    return await this.studentRepository.save(student);
  }

  async findAll(query: StudentQueryDto, user: User) {
    const {
      keyword,
      fullName,
      code,
      schoolId,
      parentId,
      stage,
      class: studentClass,
    } = query;

    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.school', 'school')
      .leftJoinAndSelect('student.parent', 'parent')
      .leftJoinAndSelect('parent.user', 'parentUser')
      .leftJoinAndSelect('student.user', 'user');

    if (user.role === RolesEnum.PARENT) {
      queryBuilder.andWhere('student.parentId = :parentId', {
        parentId: user.parentId,
      });
    } else if (user.role === RolesEnum.SCHOOL) {
      queryBuilder.andWhere('student.schoolId = :schoolId', {
        schoolId: user.schoolId,
      });
    } else if (user.role === RolesEnum.DELIVERY_PERSON) {
      queryBuilder.andWhere('student.parentId = :parentId', {
        parentId: user.parentId,
      });
    }
    if (keyword) {
      queryBuilder.andWhere(
        '(student.fullName ILIKE :search OR student.code ILIKE :search)',
        { search: `%${keyword}%` },
      );
    }

    if (fullName) {
      queryBuilder.andWhere('student.fullName ILIKE :fullName', {
        fullName: `%${fullName}%`,
      });
    }

    if (code) {
      queryBuilder.andWhere('student.code ILIKE :code', {
        code: `%${code}%`,
      });
    }

    if (schoolId) {
      queryBuilder.andWhere('student.schoolId = :schoolId', { schoolId });
    }

    if (parentId) {
      queryBuilder.andWhere('student.parentId = :parentId', { parentId });
    }

    if (stage) {
      queryBuilder.andWhere('student.stage ILIKE :stage', {
        stage: `%${stage}%`,
      });
    }

    if (studentClass) {
      queryBuilder.andWhere('student.class ILIKE :class', {
        class: `%${studentClass}%`,
      });
    }

    let result = await PaginationService.paginateQueryBuilder<Student>(
      queryBuilder,
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        basePath: 'student',
        defaultSortColumn: 'student.createdAt',
      },
    );

    // Format the response for each student
    let items = await Promise.all(
      result.items.map((student) => this.formatedResponse(student)),
    );

    return {
      ...result,
      items: items,
    };
  }

  async findOne(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['school', 'parent', 'user', 'parent.user'],
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return this.formatedResponse(student);
  }

  async update(
    id: number,
    updateStudentDto: UpdateStudentDto,
    profileImage?: Express.Multer.File,
  ): Promise<Student> {
    const student = await this.findOne(id);

    // Check if code is being updated and already exists
    if (updateStudentDto.code && updateStudentDto.code !== student.code) {
      const existingStudent = await this.studentRepository.findOne({
        where: { code: updateStudentDto.code },
      });

      if (existingStudent) {
        throw new ConflictException(
          `Student with code ${updateStudentDto.code} already exists`,
        );
      }
    }

    let savedProfileImage: any = undefined;
    if (profileImage) {
      savedProfileImage =
        await this.fileUploadService.uploadImage(profileImage);
      Object.assign(student, {
        ...updateStudentDto,
        profileImage: savedProfileImage,
      });
    } else {
      Object.assign(student, updateStudentDto);
    }

    return await this.studentRepository.save(student);
  }

  async remove(id: number): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepository.softDelete(student.id);
  }

  async findStudentsForParent(parentId: number){
    const students = await this.studentRepository.find({
      where: { parentId },
      relations: ['school', 'parent' ,'user', 'parent.user'],
    });
    return Promise.all(students.map(student => this.formatedResponse(student)));
  }
}
