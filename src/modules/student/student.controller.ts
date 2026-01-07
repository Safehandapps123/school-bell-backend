import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';
import { Auth } from 'src/common/guards/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { CurrentUser } from 'src/common/guards/user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Students')
@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Auth(RolesEnum.PARENT)
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateStudentDto,
  })
  @ApiOperation({ summary: 'Create a new student' })
  @SuccessResponse('Student created successfully', 201)
  create(
    @Body() createStudentDto: CreateStudentDto,
    @CurrentUser() user: User,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    return this.studentService.create(createStudentDto, user, profileImage);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Get all students with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated students' })
  @SuccessResponse('Students retrieved successfully', 200)
  findAll(@Query() query: StudentQueryDto ,@CurrentUser() user:User) {
    return this.studentService.findAll(query ,user);
  }

  @Get('parent/:parentId')
  @Auth()
  @ApiOperation({ summary: 'Get students by parent ID' })
  @ApiResponse({ status: 200, description: 'Returns the students for the parent' })
  @SuccessResponse('Students retrieved successfully', 200)
  findStudentsForParent(@Param('parentId', ParseIntPipe) parentId: number) {
    return this.studentService.findStudentsForParent(parentId);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get a student by ID' })
  @ApiResponse({ status: 200, description: 'Returns the student' })
  @SuccessResponse('Student retrieved successfully', 200)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  @Auth(RolesEnum.PARENT)
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateStudentDto,
  })
  @ApiOperation({ summary: 'Update a student' })
  @SuccessResponse('Student updated successfully', 200)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    return this.studentService.update(id, updateStudentDto, profileImage);
  }
 
  @Delete(':id')
  @Auth(RolesEnum.PARENT)
  @ApiOperation({ summary: 'Delete a student (soft delete)' })
  @SuccessResponse('Student deleted successfully', 200)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentService.remove(id);
  }
}
