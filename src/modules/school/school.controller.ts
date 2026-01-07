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
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SchoolQueryDto } from './dto/school-query.dto';
import { SchoolStatisticsDto } from './dto/school-statistics.dto';
import { SchoolDashboardDto } from './dto/school-dashboard.dto';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';
import { Auth } from '../../common/guards/auth.decorator';
import { CurrentUser } from '../../common/guards/user.decorator';
import { User } from '../user/entities/user.entity';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-auth.guard';
import { SchoolStatus } from './enums/school-status.enum';
import { RolesEnum } from 'src/common/enums/roles.enum';

@ApiTags('Schools')
@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  @SuccessResponse('School created successfully', 201)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: { type: 'string', format: 'binary' },
        name: { type: 'string', example: 'Al-Noor School' },
        description: { type: 'string', example: 'A leading educational institution' },
        location: { type: 'string', example: 'Cairo, Egypt' },
        stages: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['الابتدائية', 'الإعدادية', 'الثانوية']
        },
      },
      required: ['name'],
    },
  })
  @ApiOperation({ summary: 'Create a new school' })
  @ApiResponse({ status: 201, description: 'School created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @SuccessResponse('School created successfully', 201)
  create(
    @Body() createSchoolDto: CreateSchoolDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.schoolService.create(createSchoolDto, logo);
  }

  @Patch('closed-time')
  @Auth(RolesEnum.SCHOOL)
  @SuccessResponse('School closed time updated successfully', 200)
  @ApiOperation({ summary: 'Set or update school closed time' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        closedTime: { type: 'string', format: 'time', example: '18:00:00' },
      },
      required: ['closedTime'],
    },
  })
  async setClosedTime(
    @Body('closedTime') closedTime: string,
    @CurrentUser() user: User,
  ) {
    return this.schoolService.setSchoolClosedTime(user.schoolId, closedTime);
  }

  @Get('closed-time')
  @Auth(RolesEnum.SCHOOL)
  @SuccessResponse('School closed time retrieved successfully', 200)
  @ApiOperation({ summary: 'Get school closed time' })
  @ApiResponse({ status: 200, description: 'School closed time retrieved successfully' })
  async getClosedTime(@CurrentUser() user: User) {
    return this.schoolService.getSchoolClosedTime(user.schoolId);
  }

  @Get('dashboard')
  @SuccessResponse('Dashboard retrieved successfully', 200)
  @ApiOperation({
    summary: 'Get schools dashboard overview',
    description: `
    Get comprehensive dashboard statistics for schools management.
    
    **Includes:**
    - إجمالي المدارس (Total schools)
    - المدارس النشطة (Active schools)
    - مدارس معلقة (Suspended schools)
    - مدارس في انتظار الموافقة (Pending schools)
    - جديدة هذا الأسبوع (New this week)
    - جديدة هذا الشهر (New this month)
    - تم تفعيلها اليوم (Activated today)
    - المدارس المضافة مؤخراً (Recently added schools)
    - توزيع المدارس حسب المنطقة (Schools by region)
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard retrieved successfully',
    type: SchoolDashboardDto,
    schema: {
      example: {
        success: true,
        message: 'Dashboard retrieved successfully',
        data: {
          totalSchools: 156,
          activeSchools: 142,
          suspendedSchools: 14,
          pendingSchools: 3,
          newThisWeek: 3,
          newThisMonth: 12,
          activatedToday: 5,
          recentSchools: [
            {
              id: 1,
              name: 'مدرسة التفوق الابتدائية',
              location: 'الرياض، حي العليا',
              logo: 'https://example.com/logo.jpg',
              status: 'active',
              createdAt: '2025-11-22T08:00:00Z',
            },
            {
              id: 2,
              name: 'مدرسة النجاح الثانوية',
              location: 'جدة، حي الحمراء',
              logo: 'https://example.com/logo2.jpg',
              status: 'active',
              createdAt: '2025-11-22T03:00:00Z',
            },
          ],
          schoolsByRegion: [
            { region: 'الرياض', count: 45 },
            { region: 'جدة', count: 32 },
            { region: 'الدمام', count: 24 },
            { region: 'مكة', count: 18 },
            { region: 'المدينة', count: 15 },
            { region: 'أخرى', count: 22 },
          ],
        },
      },
    },
  })
  getDashboard() {
    return this.schoolService.getDashboard();
  }

  @Get('statistics')
  @Auth()
  @SuccessResponse('Statistics retrieved successfully', 200)
  getStatistics(@CurrentUser() user: User) {
    return this.schoolService.getStatistics(user);
  }

  @Get()
  @SuccessResponse('Schools retrieved successfully', 200)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all schools with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated schools' })
  findAll(@Query() query: SchoolQueryDto ,@CurrentUser() user:User) {
    return this.schoolService.findAll(query ,user);
  }

  @Get(':id')
  @SuccessResponse('School retrieved successfully', 200)
  @ApiOperation({ summary: 'Get a school by ID' })
  @ApiResponse({ status: 200, description: 'Returns the school' })
  @ApiResponse({ status: 404, description: 'School not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schoolService.findOne(id);
  }

  @Patch(':id/status')
  @SuccessResponse('School status updated successfully', 200)
  @ApiOperation({ summary: 'Toggle school status (active/suspended)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(SchoolStatus),
          example: SchoolStatus.ACTIVE,
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'School status updated successfully' })
  @ApiResponse({ status: 404, description: 'School not found' })
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: SchoolStatus,
  ) {
    return this.schoolService.toggelSchoolStatus(id, status);
  }

  @Patch(':id')
  @SuccessResponse('School updated successfully', 200)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: { type: 'string', format: 'binary' },
        name: { type: 'string' },
        description: { type: 'string' },
        location: { type: 'string' },
        stages: { 
          type: 'array', 
          items: { type: 'string' }
        },
      },
    },
  })
  @ApiOperation({ summary: 'Update a school' })
  @ApiResponse({ status: 200, description: 'School updated successfully' })
  @ApiResponse({ status: 404, description: 'School not found' })
  @SuccessResponse('School updated successfully', 200)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSchoolDto: UpdateSchoolDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.schoolService.update(id, updateSchoolDto, logo);
  }

  @Delete(':id')
  @SuccessResponse('School deleted successfully', 200)
  @ApiOperation({ summary: 'Delete a school' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schoolService.remove(id);
  }
}
