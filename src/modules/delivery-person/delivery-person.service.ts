import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeliveryPersonDto } from './dto/create-delivery-person.dto';
import { UpdateDeliveryPersonDto } from './dto/update-delivery-person.dto';
import { DeliveryPersonQueryDto } from './dto/delivery-person-query.dto';
import { DeliveryPerson } from './entities/delivery-person.entity';
import { PaginationService } from '../../common/utils/pagination.utils';
import { FileUploadService } from '../../common/fileUpload/file-upload.service';
import { User } from '../user/entities/user.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { PasswordService } from 'src/common/helpers/encryption/password.service';

@Injectable()
export class DeliveryPersonService {
  constructor(
    @InjectRepository(DeliveryPerson)
    private readonly deliveryPersonRepository: Repository<DeliveryPerson>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fileUploadService: FileUploadService,
    private readonly passwordService: PasswordService,
  ) {}

  async create(
    createDeliveryPersonDto: CreateDeliveryPersonDto,
    createdBy: User,
    profileImage?: Express.Multer.File,
    nationalIdFront?: Express.Multer.File,
    nationalIdBack?: Express.Multer.File,
  ) {
    const existingByUser = await this.userRepository.findOne({
      where: { email: createDeliveryPersonDto.email },
    });

    if (existingByUser) {
      throw new ConflictException(
        `Delivery person profile for user ID ${createDeliveryPersonDto.email} already exists`,
      );
    }

    if (createDeliveryPersonDto.nationalId) {
      const existingByNationalId = await this.deliveryPersonRepository.findOne({
        where: { nationalId: createDeliveryPersonDto.nationalId },
      });

      if (existingByNationalId) {
        throw new ConflictException(
          `National ID ${createDeliveryPersonDto.nationalId} already exists`,
        );
      }
    }

    const hashedPassword = await this.passwordService.hash(
      createDeliveryPersonDto.password,
    );

    const user = this.userRepository.create({
      email: createDeliveryPersonDto.email,
      role: RolesEnum.DELIVERY_PERSON,
      password: hashedPassword,
      phoneNumber: createDeliveryPersonDto.phoneNumber,
      schoolId: createdBy.schoolId,
      parentId: createdBy.parentId,
      studentId: createdBy.studentId,
    });
    const savedUser = await this.userRepository.save(user);

    const deliveryPersonData: Partial<DeliveryPerson> = {
      ...createDeliveryPersonDto,
      userId: savedUser.id,
    };

    // Upload images if provided
    if (profileImage) {
      const uploadedProfileImage =
        await this.fileUploadService.uploadImage(profileImage);
      deliveryPersonData.profileImage = uploadedProfileImage;
    }

    if (nationalIdFront) {
      const uploadedNationalIdFront =
        await this.fileUploadService.uploadImage(nationalIdFront);
      deliveryPersonData.nationalIdFront = uploadedNationalIdFront;
    }

    if (nationalIdBack) {
      const uploadedNationalIdBack =
        await this.fileUploadService.uploadImage(nationalIdBack);
      deliveryPersonData.nationalIdBack = uploadedNationalIdBack;
    }

    const deliveryPerson =
      this.deliveryPersonRepository.create(deliveryPersonData);
    const savedDeliveryPerson =
      await this.deliveryPersonRepository.save(deliveryPerson);

    // Update user with deliveryPersonId
    savedUser.deliveryPersonId = savedDeliveryPerson.id;
    await this.userRepository.save(savedUser);

    const result = await this.deliveryPersonRepository.findOne({
      where: { id: savedDeliveryPerson.id },
      relations: ['user'],
    });

    if (!result) {
      throw new NotFoundException(`Failed to retrieve created delivery person`);
    }

    return this.formatedResponse(result);
  }

  async findAll(query: DeliveryPersonQueryDto, user: User) {
    const { keyword, fullName, nationalId, userId } = query;

    const queryBuilder = this.deliveryPersonRepository
      .createQueryBuilder('deliveryPerson')
      .leftJoinAndSelect('deliveryPerson.user', 'user');
    if (user.role === RolesEnum.PARENT) {
      queryBuilder.andWhere('user.parentId = :parentId', {
        parentId: user.parentId,
      });
    } else if (user.role === RolesEnum.SCHOOL) {
      queryBuilder.andWhere('user.schoolId = :schoolId', {
        schoolId: user.schoolId,
      });
    } else if (user.role === RolesEnum.STUDENT) {
      queryBuilder.andWhere('user.studentId = :studentId', {
        studentId: user.studentId,
      });
    }
    if (keyword) {
      queryBuilder.andWhere(
        '(deliveryPerson.fullName ILIKE :search OR deliveryPerson.nationalId ILIKE :search)',
        { search: `%${keyword}%` },
      );
    }

    if (fullName) {
      queryBuilder.andWhere('deliveryPerson.fullName ILIKE :fullName', {
        fullName: `%${fullName}%`,
      });
    }

    if (nationalId) {
      queryBuilder.andWhere('deliveryPerson.nationalId ILIKE :nationalId', {
        nationalId: `%${nationalId}%`,
      });
    }

    if (userId) {
      queryBuilder.andWhere('deliveryPerson.userId = :userId', { userId });
    }

    const result = await PaginationService.paginateQueryBuilder<DeliveryPerson>(
      queryBuilder,
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        basePath: 'delivery-person',
        defaultSortColumn: 'deliveryPerson.createdAt',
      },
    );

    const items = await Promise.all(
      result.items.map((deliveryPerson) =>
        this.formatedResponse(deliveryPerson),
      ),
    );

    return {
      ...result,
      items,
    };
  }

  async findOne(id: number) {
    const deliveryPerson = await this.deliveryPersonRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!deliveryPerson) {
      throw new NotFoundException(`Delivery person with ID ${id} not found`);
    }

    return this.formatedResponse(deliveryPerson);
  }

  async update(
    id: number,
    updateDeliveryPersonDto: UpdateDeliveryPersonDto,
    profileImage?: Express.Multer.File,
    nationalIdFront?: Express.Multer.File,
    nationalIdBack?: Express.Multer.File,
  ) {
    const deliveryPerson = await this.deliveryPersonRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!deliveryPerson) {
      throw new NotFoundException(`Delivery person with ID ${id} not found`);
    }

    // Check if national ID is being updated and already exists
    if (
      updateDeliveryPersonDto.nationalId &&
      updateDeliveryPersonDto.nationalId !== deliveryPerson.nationalId
    ) {
      const existingByNationalId = await this.deliveryPersonRepository.findOne({
        where: { nationalId: updateDeliveryPersonDto.nationalId },
      });

      if (existingByNationalId) {
        throw new ConflictException(
          `National ID ${updateDeliveryPersonDto.nationalId} already exists`,
        );
      }
    }

    // Upload new images if provided
    if (profileImage) {
      const uploadedProfileImage =
        await this.fileUploadService.uploadImage(profileImage);
      updateDeliveryPersonDto.profileImage = uploadedProfileImage;
    }

    if (nationalIdFront) {
      const uploadedNationalIdFront =
        await this.fileUploadService.uploadImage(nationalIdFront);
      updateDeliveryPersonDto.nationalIdFront = uploadedNationalIdFront;
    }

    if (nationalIdBack) {
      const uploadedNationalIdBack =
        await this.fileUploadService.uploadImage(nationalIdBack);
      updateDeliveryPersonDto.nationalIdBack = uploadedNationalIdBack;
    }

    Object.assign(deliveryPerson, updateDeliveryPersonDto);
    await this.deliveryPersonRepository.save(deliveryPerson);

    const updated = await this.deliveryPersonRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!updated) {
      throw new NotFoundException(`Failed to retrieve updated delivery person`);
    }

    return this.formatedResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const deliveryPerson = await this.deliveryPersonRepository.findOne({
      where: { id },
    });

    if (!deliveryPerson) {
      throw new NotFoundException(`Delivery person with ID ${id} not found`);
    }

    await this.deliveryPersonRepository.softDelete(deliveryPerson.id);
  }

  private async formatedResponse(deliveryPerson: DeliveryPerson) {
    return {
      id: deliveryPerson.id,
      fullName: deliveryPerson.fullName,
      profileImage: deliveryPerson.profileImage,
      nationalId: deliveryPerson.nationalId,
      nationalIdFront: deliveryPerson.nationalIdFront,
      nationalIdBack: deliveryPerson.nationalIdBack,
      user: {
        id: deliveryPerson.user?.id,
        email: deliveryPerson.user?.email,
        phoneNumber: deliveryPerson.user?.phoneNumber,
        role: deliveryPerson.user?.role,
      },
    };
  }
}
