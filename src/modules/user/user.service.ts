import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationService } from 'src/common/utils/pagination.utils';
import { Repository } from 'typeorm';
import { UserQueryDto } from './dto/requests/find-user-query.dto';
import { ParentQueryDto } from './dto/requests/parent-query.dto';
import { User } from './entities/user.entity';
import { Parent } from './entities/parent.entity';
import { CustomI18nService } from '../../common/services/custom-i18n.service';
import { UpdateUserDto } from './dto/requests/update-user.dto';
import { RolesEnum } from 'src/common/enums/roles.enum';
import {
  GenderDistributionDto,
  RoleDistributionDto,
  UserActivityDto,
  UserDashboardResponseDto,
  UserStatisticsDto,
} from './dto/user-statistics.dto';
import { UserStatus } from './enums/user-status.enum';
import { CreateUserDto } from './dto/requests/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    
    private readonly i18n: CustomI18nService,
  ) {}

  async create(userDto: CreateUserDto) {
    const user = this.userRepository.create({
      email: userDto.email,
      password: userDto.password,
      role: userDto.role,
      isEmailVerified: true,
      status: UserStatus.VERIFIED,
    });
    const newUser = await this.userRepository.save(user);
    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
  }

  async findAll(query: UserQueryDto) {
    let { keyword, email, phoneNumber, fullName } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user');

    if (keyword) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR ' +
          'user.phoneNumber ILIKE :search OR ' +
          'user.fullName ILIKE :search)',
        { search: `%${keyword}%` },
      );
    }

    if (email) {
      queryBuilder.andWhere('user.email = :email', { email });
    }

    if (phoneNumber) {
      queryBuilder.andWhere('user.phoneNumber ILIKE :phoneNumber', {
        phoneNumber: `%${phoneNumber}%`,
      });
    }

    if (fullName) {
      queryBuilder.andWhere('user.fullName ILIKE :fullName', {
        fullName: `%${fullName}%`,
      });
    }

    const result = await PaginationService.paginateQueryBuilder<User>(
      queryBuilder,
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        basePath: 'user',
        defaultSortColumn: 'user.createdAt',
      },
    );

    return result;
  }

  async findAllParents(query: ParentQueryDto, user: User) {
    const { keyword, fullName, nationalId, userId } = query;

    const queryBuilder = this.parentRepository
      .createQueryBuilder('parent')
      .leftJoinAndSelect('parent.user', 'user')
      .leftJoinAndSelect('parent.students', 'students')
      .leftJoinAndSelect('students.school', 'school')
      .select([
        'parent.id',
        'parent.userId',
        'parent.fullName',
        'parent.profileImage',
        'parent.nationalId',
        'parent.nationalIdFront',
        'parent.nationalIdBack',
        'parent.createdAt',
        'parent.updatedAt',
        'user.id',
        'user.email',
        'user.phoneNumber',
        'user.role',
        'students.id',
        'students.fullName',
        'students.profileImage',
        'students.code',
        'students.class',
        'students.stage',
        'school.id',
        'school.name',
        'school.logo',
      ]);

    // Role-based filtering
    if (user.role === RolesEnum.PARENT) {
      queryBuilder.andWhere('parent.id = :parentId', {
        parentId: user.parentId,
      });
    } else if (user.role === RolesEnum.SCHOOL) {
      queryBuilder.andWhere('students.schoolId = :schoolId', {
        schoolId: user.schoolId,
      });
    } else if (user.role === RolesEnum.DELIVERY_PERSON) {
      queryBuilder.andWhere('parent.id = :parentId', {
        parentId: user.parentId,
      });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(parent.fullName ILIKE :search OR parent.nationalId ILIKE :search OR user.email ILIKE :search OR user.phoneNumber ILIKE :search)',
        { search: `%${keyword}%` },
      );
    }

    if (fullName) {
      queryBuilder.andWhere('parent.fullName ILIKE :fullName', {
        fullName: `%${fullName}%`,
      });
    }

    if (nationalId) {
      queryBuilder.andWhere('parent.nationalId ILIKE :nationalId', {
        nationalId: `%${nationalId}%`,
      });
    }

    if (userId) {
      queryBuilder.andWhere('parent.userId = :userId', { userId });
    }

    let result = await PaginationService.paginateQueryBuilder<Parent>(
      queryBuilder,
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        basePath: 'user/parents',
        defaultSortColumn: 'parent.createdAt',
      },
    );

    // Format the response for each parent
    let items = await Promise.all(
      result.items.map((parent) => this.formatedParentResponse(parent)),
    );

    return {
      ...result,
      items: items,
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['parentProfile', 'studentProfile', 'school' ,'deliveryPersonProfile'],
    });
    if (!user) {
      throw new NotFoundException(this.i18n.t('user.USER_NOT_FOUND'));
    }
    let profileImage: string | null = null;
    let fullName: string | null = null;
    if(user.role === RolesEnum.PARENT && user.parentProfile){
      profileImage = user.parentProfile.profileImage;
      fullName = user.parentProfile.fullName;
    }
    if(user.role === RolesEnum.STUDENT && user.studentProfile){
      profileImage = user.studentProfile.profileImage;
      fullName = user.studentProfile.fullName;
    }
    if(user.role === RolesEnum.SCHOOL && user.school){
      profileImage = user.school.logo;
    }
    if(user.role === RolesEnum.DELIVERY_PERSON && user.deliveryPersonProfile){
      profileImage = user.deliveryPersonProfile.profileImage;
      fullName = user.deliveryPersonProfile.fullName;
    }
    return {
      ...user,
      id: user.id,
      profileImage,
      fullName,
    };
  }

  async update(id: number, updateUserServiceDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(this.i18n.t('user.USER_NOT_FOUND'));
    }
    Object.assign(user, updateUserServiceDto);
    return this.userRepository.save(user);
  }

  async deleteUserById(id: number, currentUser: User) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(this.i18n.t('user.USER_NOT_FOUND', { id }));
    }
    await this.userRepository.softDelete(user.id);
    return null;
  }

  async findByUserId(userId: number) {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateUserRole(userId: number, role: RolesEnum) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(
        this.i18n.t('user.USER_NOT_FOUND', { userId }),
      );
    }
    user.role = role;
    return this.userRepository.save(user);
  }

  async toggleBlockUser(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(
        this.i18n.t('user.USER_NOT_FOUND', { userId }),
      );
    }
    user.status =
      user.status === UserStatus.BLOCKED
        ? UserStatus.VERIFIED
        : UserStatus.BLOCKED;
    return this.userRepository.save(user);
  }

  private async formatedParentResponse(parent: Parent) {
    return {
      id: parent.id,
      fullName: parent.fullName,
      profileImage: parent.profileImage,
      nationalId: parent.nationalId,
      nationalIdFront: parent.nationalIdFront,
      nationalIdBack: parent.nationalIdBack,
      user: {
        id: parent.user?.id,
        email: parent.user?.email,
        phoneNumber: parent.user?.phoneNumber,
        role: parent.user?.role,
      },
      students: parent.students?.map((student) => ({
        id: student.id,
        fullName: student.fullName,
        profileImage: student.profileImage,
        code: student.code,
        class: student.class,
        stage: student.stage,
        school: {
          id: student.school?.id,
          name: student.school?.name,
          logo: student.school?.logo,
        },
      })) || [],
    };
  }
}