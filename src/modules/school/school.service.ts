import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { SchoolQueryDto } from './dto/school-query.dto';
import { SchoolStatisticsDto } from './dto/school-statistics.dto';
import { SchoolDashboardDto } from './dto/school-dashboard.dto';
import { School } from './entities/school.entity';
import { Student } from '../student/entities/student.entity';
import { Parent } from '../user/entities/parent.entity';
import { DeliveryPerson } from '../delivery-person/entities/delivery-person.entity';
import { ReqForReceipt } from '../req-for-receipt/entities/req-for-receipt.entity';
import { RequestStautsEnum } from '../req-for-receipt/enums/request-status.enum';
import { PaginationService } from '../../common/utils/pagination.utils';
import { FileUploadService } from '../../common/fileUpload/file-upload.service';
import { User } from '../user/entities/user.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SchoolStatus } from './enums/school-status.enum';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,

    @InjectRepository(DeliveryPerson)
    private readonly deliveryPersonRepository: Repository<DeliveryPerson>,

    @InjectRepository(ReqForReceipt)
    private readonly reqForReceiptRepository: Repository<ReqForReceipt>,

    private readonly fileUploadService: FileUploadService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    createSchoolDto: CreateSchoolDto,
    logo?: Express.Multer.File,
  ): Promise<School> {
    let savedLogo: any = undefined;
    if (logo) {
      savedLogo = await this.fileUploadService.uploadImage(logo);
    }
    const school = this.schoolRepository.create({
      ...createSchoolDto,
      logo: savedLogo,
    });
    return await this.schoolRepository.save(school);
  }

  async findAll(query: SchoolQueryDto, user?: User) {
    const { keyword, name, location } = query;

    const queryBuilder = this.schoolRepository
      .createQueryBuilder('school')
      .select([
        'school.id',
        'school.name',
        'school.logo',
        'school.description',
        'school.location',
        'school.stages',
        'school.createdAt',
        'school.updatedAt',
        'school.status',
        'school.closedTime',
      ]);

    if ((user && user.role !== RolesEnum.SUPER_ADMIN) || !user) {
      queryBuilder.andWhere('school.status = :status', {
        status: SchoolStatus.ACTIVE,
      });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(school.name ILIKE :search OR ' +
          'school.location ILIKE :search OR ' +
          'school.description ILIKE :search)',
        { search: `%${keyword}%` },
      );
    }

    if (name) {
      queryBuilder.andWhere('school.name ILIKE :name', {
        name: `%${name}%`,
      });
    }

    if (location) {
      queryBuilder.andWhere('school.location ILIKE :location', {
        location: `%${location}%`,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('school.status = :status', {
        status: query.status,
      });
    }

    const result = await PaginationService.paginateQueryBuilder<School>(
      queryBuilder,
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        basePath: 'school',
        defaultSortColumn: 'school.createdAt',
      },
    );

    return result;
  }

  async findOne(id: number): Promise<School> {
    const school = await this.schoolRepository.findOne({ where: { id } });
    if (!school) {
      throw new NotFoundException(
        this.i18n.t('school.SCHOOL_NOT_FOUND', { args: { id } }),
      );
    }
    return school;
  }

  async update(
    id: number,
    updateSchoolDto: UpdateSchoolDto,
    logo?: Express.Multer.File,
  ): Promise<School> {
    const school = await this.findOne(id);

    let savedLogo: any = undefined;
    if (logo) {
      savedLogo = await this.fileUploadService.uploadImage(logo);
      Object.assign(school, { ...updateSchoolDto, logo: savedLogo });
    } else {
      Object.assign(school, updateSchoolDto);
    }

    return await this.schoolRepository.save(school);
  }

  async remove(id: number): Promise<void> {
    const school = await this.findOne(id);
    await this.schoolRepository.softDelete(school.id);
  }

  async getStatistics(user: User): Promise<SchoolStatisticsDto> {
    // Get start and end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let totalStudents = 0;
    let totalDeliveryPersons = 0;
    let totalParents = 0;
    let totalRequests = 0;
    let pendingRequestsToday = 0;
    let deliveredRequestsToday = 0;
    let waitingOutsideRequestsToday = 0;
    let cancelledRequestsToday = 0;

    // Role-based statistics
    if (user.role === RolesEnum.SCHOOL) {
      // School sees only their data
      totalStudents = await this.studentRepository.count({
        where: { schoolId: user.schoolId },
      });

      totalParents = await this.parentRepository
        .createQueryBuilder('parent')
        .leftJoin('parent.students', 'student')
        .where('student.schoolId = :schoolId', { schoolId: user.schoolId })
        .getCount();

      totalDeliveryPersons = await this.deliveryPersonRepository
        .createQueryBuilder('deliveryPerson')
        .leftJoin('deliveryPerson.user', 'user')
        .where('user.schoolId = :schoolId', { schoolId: user.schoolId })
        .getCount();

      totalRequests = await this.reqForReceiptRepository
        .createQueryBuilder('req')
        .leftJoin('req.student', 'student')
        .where('student.schoolId = :schoolId', { schoolId: user.schoolId })
        .getCount();

      pendingRequestsToday = await this.reqForReceiptRepository
        .createQueryBuilder('req')
        .leftJoin('req.student', 'student')
        .where('student.schoolId = :schoolId', { schoolId: user.schoolId })
        .andWhere('req.stauts = :status', { status: RequestStautsEnum.PENDING })
        .andWhere('req.date BETWEEN :startOfDay AND :endOfDay', {
          startOfDay,
          endOfDay,
        })
        .getCount();

      deliveredRequestsToday = await this.reqForReceiptRepository
        .createQueryBuilder('req')
        .leftJoin('req.student', 'student')
        .where('student.schoolId = :schoolId', { schoolId: user.schoolId })
        .andWhere('req.stauts = :status', {
          status: RequestStautsEnum.DELIVERD,
        })
        .andWhere('req.date BETWEEN :startOfDay AND :endOfDay', {
          startOfDay,
          endOfDay,
        })
        .getCount();

      waitingOutsideRequestsToday = await this.reqForReceiptRepository
        .createQueryBuilder('req')
        .leftJoin('req.student', 'student')
        .where('student.schoolId = :schoolId', { schoolId: user.schoolId })
        .andWhere('req.stauts = :status', {
          status: RequestStautsEnum.WATINGOUTSIDE,
        })
        .andWhere('req.date BETWEEN :startOfDay AND :endOfDay', {
          startOfDay,
          endOfDay,
        })
        .getCount();

      cancelledRequestsToday = await this.reqForReceiptRepository
        .createQueryBuilder('req')
        .leftJoin('req.student', 'student')
        .where('student.schoolId = :schoolId', { schoolId: user.schoolId })
        .andWhere('req.stauts = :status', { status: RequestStautsEnum.CANCELD })
        .andWhere('req.date BETWEEN :startOfDay AND :endOfDay', {
          startOfDay,
          endOfDay,
        })
        .getCount();
    } else {
      // Admin/Super Admin sees all data
      totalStudents = await this.studentRepository.count();
      totalParents = await this.parentRepository.count();
      totalDeliveryPersons = await this.deliveryPersonRepository.count();
      totalRequests = await this.reqForReceiptRepository.count();

      pendingRequestsToday = await this.reqForReceiptRepository.count({
        where: {
          stauts: RequestStautsEnum.PENDING,
          date: Between(startOfDay, endOfDay),
        },
      });

      deliveredRequestsToday = await this.reqForReceiptRepository.count({
        where: {
          stauts: RequestStautsEnum.DELIVERD,
          date: Between(startOfDay, endOfDay),
        },
      });

      waitingOutsideRequestsToday = await this.reqForReceiptRepository.count({
        where: {
          stauts: RequestStautsEnum.WATINGOUTSIDE,
          date: Between(startOfDay, endOfDay),
        },
      });

      cancelledRequestsToday = await this.reqForReceiptRepository.count({
        where: {
          stauts: RequestStautsEnum.CANCELD,
          date: Between(startOfDay, endOfDay),
        },
      });
    }

    return {
      totalStudents,
      totalDeliveryPersons,
      totalParents,
      totalRequests,
      pendingRequestsToday,
      deliveredRequestsToday,
      waitingOutsideRequestsToday,
      cancelledRequestsToday,
    };
  }

  async getDashboard(): Promise<SchoolDashboardDto> {
    // Get date ranges
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Total schools count
    const totalSchools = await this.schoolRepository.count();

    // Active schools count
    const activeSchools = await this.schoolRepository.count({
      where: { status: SchoolStatus.ACTIVE },
    });

    // Suspended/Inactive schools count
    const suspendedSchools = await this.schoolRepository.count({
      where: { status: SchoolStatus.INACTIVE },
    });

    // Pending schools count
    const pendingSchools = await this.schoolRepository.count({
      where: { status: SchoolStatus.PENDING },
    });

    // New schools this week
    const newThisWeek = await this.schoolRepository
      .createQueryBuilder('school')
      .where('school.createdAt >= :startOfWeek', { startOfWeek })
      .getCount();

    // New schools this month
    const newThisMonth = await this.schoolRepository
      .createQueryBuilder('school')
      .where('school.createdAt >= :startOfMonth', { startOfMonth })
      .getCount();

    // Schools activated today
    const activatedToday = await this.schoolRepository
      .createQueryBuilder('school')
      .where('school.status = :status', { status: SchoolStatus.ACTIVE })
      .andWhere('school.updatedAt >= :startOfToday', { startOfToday })
      .getCount();

    // Recent schools (last 10)
    const recentSchoolsRaw = await this.schoolRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const recentSchools = recentSchoolsRaw.map((school) => ({
      id: school.id,
      name: school.name,
      location: school.location || this.i18n.t('school.UNSPECIFIED_LOCATION'),
      logo: school.logo,
      status: school.status,
      createdAt: school.createdAt,
    }));

    // Schools by region (group by location)
    const schoolsByLocationRaw = await this.schoolRepository
      .createQueryBuilder('school')
      .select('school.location', 'region')
      .addSelect('COUNT(school.id)', 'count')
      .where('school.location IS NOT NULL')
      .groupBy('school.location')
      .orderBy('count', 'DESC')
      .getRawMany();

    const schoolsByRegion = schoolsByLocationRaw.map((item) => ({
      region: item.region || this.i18n.t('school.OTHER'),
      count: parseInt(item.count, 10),
    }));

    // Add "أخرى" for schools without location
    const schoolsWithoutLocation = await this.schoolRepository.count({
      where: { location: IsNull() },
    });

    if (schoolsWithoutLocation > 0) {
      schoolsByRegion.push({
        region: this.i18n.t('school.OTHER'),
        count: schoolsWithoutLocation,
      });
    }

    return {
      totalSchools,
      activeSchools,
      suspendedSchools,
      pendingSchools,
      newThisWeek,
      newThisMonth,
      activatedToday,
      recentSchools,
      schoolsByRegion: schoolsByRegion.slice(0, 6), // Top 6 regions
    };
  }

  async toggelSchoolStatus(
    id: number,
    status: SchoolStatus,
  ): Promise<School> {
    const school = await this.findOne(id);
    school.status = status;
    return await this.schoolRepository.save(school);
  }

  async setSchoolClosedTime(
    id: number,
    closedTime: string,
  ) {
    const school = await this.findOne(id);
    school.closedTime = closedTime;
    await this.schoolRepository.save(school);
    return {
      closedTime: school.closedTime,
    }
  }

  async getSchoolClosedTime(id: number) {
    const school = await this.findOne(id);
    return {
      closedTime: school.closedTime,
    };
  } 
}
