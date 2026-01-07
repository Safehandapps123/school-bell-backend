import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReqForReceiptDto } from './dto/create-req-for-receipt.dto';
import { UpdateReqForReceiptDto } from './dto/update-req-for-receipt.dto';
import { ReqForReceiptQueryDto } from './dto/req-for-receipt-query.dto';
import { ReqForReceipt } from './entities/req-for-receipt.entity';
import { Student } from '../student/entities/student.entity';
import { DeliveryPerson } from '../delivery-person/entities/delivery-person.entity';
import { PaginationService } from '../../common/utils/pagination.utils';
import { HowToReceiveEnum } from './enums/how-to-receive.enum';
import { RequestStautsEnum } from './enums/request-status.enum';
import { User } from '../user/entities/user.entity';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { SchoolStatus } from '../school/enums/school-status.enum';
import { SubscriptionService } from '../subscription/subscription.service';
import { School } from '../school/entities/school.entity';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { DeliveryPersonEnum } from './enums/delivery-person.enum';
import { NotificationTypeEnum } from '../notification/enums/notification-type.enum';
import { NotificationService } from '../notification/notification.service';
import { PusherService } from '../../common/services/pusher.service';

@Injectable()
export class ReqForReceiptService {
  constructor(
    @InjectRepository(ReqForReceipt)
    private readonly reqForReceiptRepository: Repository<ReqForReceipt>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(DeliveryPerson)
    private readonly deliveryPersonRepository: Repository<DeliveryPerson>,

    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly subscriptionService: SubscriptionService,
    private readonly notificationService: NotificationService,
    private readonly pusherService: PusherService,
    private readonly i18n: I18nService,
  ) {}

  async create(createReqForReceiptDto: CreateReqForReceiptDto, user: User) {
    const student =
      user.role === RolesEnum.STUDENT
        ? await this.studentRepository.findOne({
            where: { id: user.studentId },
            relations: ['school', 'parent'],
          })
        : await this.studentRepository.findOne({
            where: { id: createReqForReceiptDto.studentId },
            relations: ['school', 'parent'],
          });
    createReqForReceiptDto.studentId = createReqForReceiptDto.studentId
      ? createReqForReceiptDto.studentId
      : student?.id;

    if (!student) {
      throw new NotFoundException(
        this.i18n.t('reqForReceipt.STUDENT_NOT_FOUND', {
          args: { id: createReqForReceiptDto.studentId },
        }),
      );
    }

    if (student.school.status === SchoolStatus.INACTIVE) {
      throw new BadRequestException(
        this.i18n.t('reqForReceipt.SCHOOL_INACTIVE', {
          args: { id: student.school.id },
        }),
      );
    }

    if (
      !(await this.subscriptionService.isSchoolSubscriptionActive(
        student.school.id,
      ))
    ) {
      await this.schoolRepository.update(student.school.id, {
        status: SchoolStatus.INACTIVE,
      });
      throw new BadRequestException(
        this.i18n.t('reqForReceipt.SCHOOL_NO_ACTIVE_SUBSCRIPTION', {
          args: { id: student.school.id },
        }),
      );
    }

    if (createReqForReceiptDto.deliveryId) {
      const deliveryPerson = await this.deliveryPersonRepository.findOne({
        where: { id: createReqForReceiptDto.deliveryId },
      });

      if (!deliveryPerson) {
        throw new NotFoundException(
          this.i18n.t('reqForReceipt.DELIVERY_PERSON_NOT_FOUND', {
            args: { id: createReqForReceiptDto.deliveryId },
          }),
        );
      }
    }

    if (
      createReqForReceiptDto.howToReceive === HowToReceiveEnum.CAR &&
      !createReqForReceiptDto.numberOfCar
    ) {
      throw new BadRequestException(
        this.i18n.t('reqForReceipt.NUMBER_OF_CAR_REQUIRED'),
      );
    }

    const reqForReceipt = this.reqForReceiptRepository.create(
      createReqForReceiptDto,
    );

    const saved = await this.reqForReceiptRepository.save(reqForReceipt);
    const result = await this.findOne(saved.id);

    // Fire Pusher event to school
    if (result.student?.school?.userId) {
      await this.pusherService.trigger(
        `school-${result.student.school.id}`,
        'new-request',
        result,
      );
    }

    return result;
  }

  async findAll(query: ReqForReceiptQueryDto, user: User) {
    const {
      keyword,
      studentId,
      deliveryId,
      howToReceive,
      status,
      fromDate,
      toDate,
    } = query;

    const queryBuilder = this.reqForReceiptRepository
      .createQueryBuilder('reqForReceipt')
      .leftJoinAndSelect('reqForReceipt.student', 'student')
      .leftJoinAndSelect('reqForReceipt.deliveryPerson', 'deliveryPerson')
      .leftJoinAndSelect('deliveryPerson.user', 'deliveryUser')
      .leftJoinAndSelect('student.school', 'school')
      .leftJoinAndSelect('student.parent', 'parent');

    if (user.role === RolesEnum.PARENT) {
      queryBuilder.andWhere('student.parentId = :parentId', {
        parentId: user.parentId,
      });
    } else if (user.role === RolesEnum.SCHOOL) {
      queryBuilder.andWhere('student.schoolId = :schoolId', {
        schoolId: user.schoolId,
      });
    } else if (user.role === RolesEnum.DELIVERY_PERSON) {
      queryBuilder.andWhere('reqForReceipt.deliveryId = :deliveryId', {
        deliveryId: user.deliveryPersonId,
      });
    } else if (user.role === RolesEnum.STUDENT) {
      queryBuilder.andWhere('reqForReceipt.studentId = :studentId', {
        studentId: user.studentId,
      });
    }
    if (keyword) {
      queryBuilder.andWhere(
        '(student.fullName ILIKE :search OR student.code ILIKE :search OR reqForReceipt.numberOfCar ILIKE :search)',
        { search: `%${keyword}%` },
      );
    }

    if (studentId) {
      queryBuilder.andWhere('reqForReceipt.studentId = :studentId', {
        studentId,
      });
    }

    if (deliveryId) {
      queryBuilder.andWhere('reqForReceipt.deliveryId = :deliveryId', {
        deliveryId,
      });
    }

    if (howToReceive) {
      queryBuilder.andWhere('reqForReceipt.howToReceive = :howToReceive', {
        howToReceive,
      });
    }

    if (status) {
      queryBuilder.andWhere('reqForReceipt.stauts = :status', { status });
    }

    if (fromDate && toDate) {
      const startDate = new Date(fromDate);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(toDate);
      endDate.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere('reqForReceipt.date >= :fromDate', {
        fromDate: startDate,
      });
      queryBuilder.andWhere('reqForReceipt.date <= :toDate', {
        toDate: endDate,
      });
    }
    console.log(queryBuilder.getSql());
    console.log(queryBuilder.getParameters());

    const result = await PaginationService.paginateQueryBuilder<ReqForReceipt>(
      queryBuilder,
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        basePath: 'req-for-receipt',
        defaultSortColumn: 'reqForReceipt.createdAt',
      },
    );

    const items = await Promise.all(
      result.items.map((reqForReceipt) => this.formatedResponse(reqForReceipt)),
    );

    return {
      ...result,
      items,
    };
  }

  async findOne(id: number) {
    const reqForReceipt = await this.reqForReceiptRepository.findOne({
      where: { id },
      relations: [
        'student',
        'student.school',
        'student.parent',
        'deliveryPerson',
        'deliveryPerson.user',
      ],
    });

    if (!reqForReceipt) {
      throw new NotFoundException(
        this.i18n.t('reqForReceipt.RECEIPT_NOT_FOUND', { args: { id } }),
      );
    }

    return this.formatedResponse(reqForReceipt);
  }

  async update(id: number, updateReqForReceiptDto: UpdateReqForReceiptDto) {
    const reqForReceipt = await this.reqForReceiptRepository.findOne({
      where: { id },
    });

    if (!reqForReceipt) {
      throw new NotFoundException(
        this.i18n.t('reqForReceipt.RECEIPT_NOT_FOUND', { args: { id } }),
      );
    }

    // Validate student if being updated
    if (updateReqForReceiptDto.studentId) {
      const student = await this.studentRepository.findOne({
        where: { id: updateReqForReceiptDto.studentId },
      });

      if (!student) {
        throw new NotFoundException(
          `Student with ID ${updateReqForReceiptDto.studentId} not found`,
        );
      }
    }

    // Validate delivery person if being updated
    if (updateReqForReceiptDto.deliveryId) {
      const deliveryPerson = await this.deliveryPersonRepository.findOne({
        where: { id: updateReqForReceiptDto.deliveryId },
      });

      if (!deliveryPerson) {
        throw new NotFoundException(
          `Delivery person with ID ${updateReqForReceiptDto.deliveryId} not found`,
        );
      }
    }

    Object.assign(reqForReceipt, updateReqForReceiptDto);
    await this.reqForReceiptRepository.save(reqForReceipt);

    return this.findOne(id);
  }

  async updateStatus(id: number, body: UpdateRequestStatusDto, user: User) {
    const reqForReceipt = await this.reqForReceiptRepository.findOne({
      where: { id },
      relations: ['student', 'student.school'],
    });
    if (!reqForReceipt) {
      throw new NotFoundException(
        this.i18n.t('reqForReceipt.RECEIPT_NOT_FOUND', { args: { id } }),
      );
    }
    if (user.role !== RolesEnum.SCHOOL) {
      //user cant update status if status is canceld or deliverd or pending
      if (
        reqForReceipt.stauts === RequestStautsEnum.CANCELD ||
        reqForReceipt.stauts === RequestStautsEnum.DELIVERD ||
        reqForReceipt.stauts === RequestStautsEnum.PENDING
      ) {
        throw new BadRequestException(
          'لا يمكنك تحديث حالة الطلب في الوقت الحالي',
        );
      }
    }
    reqForReceipt.stauts = body.status;
    if (body.status === RequestStautsEnum.CANCELD) {
      if (!body.cancellationReason) {
        throw new BadRequestException('سبب الإلغاء مطلوب');
      }
      reqForReceipt.cancellationReason = body.cancellationReason;
      reqForReceipt.cancelledAt = new Date();
    }
    await this.reqForReceiptRepository.save(reqForReceipt);
    const result = await this.findOne(id);

    // Send notifications based on status
    await this.sendStatusNotifications(body.status, result);

    if (user.role !== RolesEnum.SCHOOL) {
      // Fire Pusher event to school
      if (reqForReceipt.student?.school?.id) {
        await this.pusherService.trigger(
          `school-${reqForReceipt.student.school.id}`,
          'new-request',
          result,
        );
      }
    }
    return result;
  }

  async remove(id: number): Promise<void> {
    const reqForReceipt = await this.reqForReceiptRepository.findOne({
      where: { id },
    });

    if (!reqForReceipt) {
      throw new NotFoundException(`Receipt request with ID ${id} not found`);
    }

    await this.reqForReceiptRepository.softDelete(id);
  }

  private async sendStatusNotifications(
    status: RequestStautsEnum,
    result: any,
  ) {
    let notificationTitle = '';
    let notificationMessage = '';
    const userIdsToNotify: number[] = [];

    switch (status) {
      case RequestStautsEnum.APPROVED:
        notificationTitle = 'تم قبول طلب الاستلام';
        notificationMessage = `تم قبول طلب استلام الطالب ${result.student.fullName}`;
        // Notify parent
        if (result.student?.parent?.userId) {
          userIdsToNotify.push(result.student.parent.userId);
        }
        break;

      case RequestStautsEnum.WATINGOUTSIDE:
        notificationTitle = 'ولي الامر في انتظارك';
        notificationMessage = `ولي امر الطالب ${result.student.fullName} في انتظارك لاستلامه`;
        // Notify school
        if (result.student.school.userId) {
          userIdsToNotify.push(result.student.school.userId);
        }
        break;

      case RequestStautsEnum.DELIVERD:
        notificationTitle = 'تم استلام الطالب بنجاح';
        notificationMessage = `تم استلام الطالب ${result.student.fullName} بنجاح`;
        // Notify parent and school
        if (result.student?.parent?.userId) {
          userIdsToNotify.push(result.student.parent.userId);
        }
        if (result.student?.school?.userId) {
          userIdsToNotify.push(result.student.school.userId);
        }
        break;

      case RequestStautsEnum.CANCELD:
        notificationTitle = 'تم إلغاء طلب الاستلام';
        notificationMessage = `تم إلغاء طلب استلام الطالب ${result.student.fullName}`;
        // Notify parent, delivery person, and school
        if (result.student?.parent?.userId) {
          userIdsToNotify.push(result.student.parent.userId);
        }
        if (result.deliveryPerson?.user?.id) {
          userIdsToNotify.push(result.deliveryPerson.user.id);
        }
        if (result.student?.school?.userId) {
          userIdsToNotify.push(result.student.school.userId);
        }
        break;
    }

    // Send notifications if there are users to notify
    if (userIdsToNotify.length > 0) {
      await this.notificationService.sendNotification({
        notificationData: {
          title: notificationTitle,
          message: notificationMessage,
          navigationData: {
            screen: 'receiptRequests',
            params: {
              id: result.id,
            },
          },
        },
        type: NotificationTypeEnum.Direct,
        target: {
          userIds: userIdsToNotify,
        },
      });
    }
  }

  async getFastRequest(user: User) {
    const whereCondition =
      user.role === RolesEnum.STUDENT
        ? { stauts: RequestStautsEnum.PENDING, studentId: user.studentId }
        : {
            stauts: RequestStautsEnum.PENDING,
            student: { parentId: user.parentId },
          };

    const reqForReceipt = await this.reqForReceiptRepository.findOne({
      where: whereCondition,
      order: { createdAt: 'ASC' },
      relations: [
        'student',
        'student.user',
        'student.school',
        'student.parent',
        'deliveryPerson',
      ],
    });

    if (!reqForReceipt) {
      const lastWhereCondition =
        user.role === RolesEnum.STUDENT
          ? { studentId: user.studentId }
          : { student: { parentId: user.parentId } };

      const lastRequest = await this.reqForReceiptRepository.findOne({
        where: lastWhereCondition,
        order: { createdAt: 'DESC' },
        relations: ['student', 'student.user'],
      });
      return {
        isRequstAvailable: false,
        data: lastRequest
          ? {
              id: lastRequest?.student.id,
              fullName: lastRequest?.student.fullName,
              profileImage: lastRequest?.student.profileImage,
              class: lastRequest?.student.class,
              stage: lastRequest?.student.stage,
            }
          : null,
      };
    }
    return {
      isRequstAvailable: true,
      data: reqForReceipt ? await this.formatedResponse(reqForReceipt) : null,
    };
  }

  async addFastRequest(studentId: number, user: User) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school', 'parent'],
    });
    if (!student) {
      throw new NotFoundException('الطالب غير موجود');
    }
    if (student.parentId !== user.parentId) {
      throw new BadRequestException('لا يمكنك تقديم طلب استلام لهذا الطالب');
    }

    // التحقق من وقت الخروج
    if (!student.school.closedTime) {
      throw new BadRequestException('وقت خروج المدرسة غير محدد');
    }

    const now = new Date();
    // تحويل closedTime من string (مثل "14:30:00") إلى دقائق
    const [closedHour, closedMinute] = student.school.closedTime
      .split(':')
      .map(Number);
    const closedTime = closedHour * 60 + closedMinute;

    // استخراج الوقت الحالي بالدقائق
    const nowTime = now.getHours() * 60 + now.getMinutes();

    // قبل ميعاد الخروج بـ 10 دقائق
    const minAllowedTime = closedTime - 10;
    // بعد ميعاد الخروج بساعة (60 دقيقة)
    const maxAllowedTime = closedTime + 60;

    if (nowTime < minAllowedTime || nowTime > maxAllowedTime) {
      throw new BadRequestException(
        `يمكنك تقديم طلب استلام سريع فقط من ${Math.floor(minAllowedTime / 60)}:${(minAllowedTime % 60).toString().padStart(2, '0')} إلى ${Math.floor(maxAllowedTime / 60)}:${(maxAllowedTime % 60).toString().padStart(2, '0')}`,
      );
    }

    // البحث عن طلب سريع سابق لنفس الطالب اليوم
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const existingRequest = await this.reqForReceiptRepository
      .createQueryBuilder('req')
      .where('req.studentId = :studentId', { studentId })
      .andWhere('req.stauts = :status', {
        status: RequestStautsEnum.FAST_REQUEST,
      })
      .andWhere('req.date >= :todayStart', { todayStart })
      .andWhere('req.date <= :todayEnd', { todayEnd })
      .orderBy('req.createdAt', 'DESC')
      .getOne();

    let saved: ReqForReceipt;

    if (existingRequest) {
      existingRequest.reminderCount = (existingRequest.reminderCount || 0) + 1;
      existingRequest.date = new Date();
      saved = await this.reqForReceiptRepository.save(existingRequest);
    } else {
      const reqForReceipt = this.reqForReceiptRepository.create({
        studentId,
        date: new Date(),
        howToReceive: HowToReceiveEnum.PERSON,
        deliveryPersonType: DeliveryPersonEnum.PARENT,
        stauts: RequestStautsEnum.FAST_REQUEST,
        reminderCount: 0,
      });
      saved = await this.reqForReceiptRepository.save(reqForReceipt);
    }

    const reqForReceiptAfterSave = await this.findOne(saved.id);
    const message =`ولي امر الطالب ${reqForReceiptAfterSave.student.fullName} في انتظارك لاستلامه`;


    if (reqForReceiptAfterSave.student.school.userId) {
      await this.notificationService.sendNotification({
        notificationData: {
          title:
            saved.reminderCount > 0
              ? `تذكير ${saved.reminderCount + 1}: ولي الامر في انتظارك`
              : 'ولي الامر في انتظارك',
          message: message,
          navigationData: {
            screen: 'receiptRequests',
            params: {
              id: reqForReceiptAfterSave.id,
            },
          },
        },
        type: NotificationTypeEnum.Direct,
        target: {
          userIds: [reqForReceiptAfterSave.student.school.userId],
        },
      });

      // Fire Pusher event to school
      await this.pusherService.trigger(
        `school-${reqForReceiptAfterSave.student.school.id}`,
        'new-request',
        {
          ...reqForReceiptAfterSave,
          message: message,
        },
      );
    }
    return this.findOne(saved.id);
  }

  private async formatedResponse(reqForReceipt: ReqForReceipt) {
    const userForSchool = await this.userRepository.findOne({
      where: {
        schoolId: reqForReceipt.student?.school?.id,
        role: RolesEnum.SCHOOL,
      },
    });
    return {
      id: reqForReceipt.id,
      date: reqForReceipt.date,
      howToReceive: reqForReceipt.howToReceive,
      numberOfCar: reqForReceipt.numberOfCar,
      location: reqForReceipt.location,
      status: reqForReceipt.stauts,
      student: {
        id: reqForReceipt.student?.id,
        fullName: reqForReceipt.student?.fullName,
        profileImage: reqForReceipt.student?.profileImage,
        code: reqForReceipt.student?.code,
        class: reqForReceipt.student?.class,
        stage: reqForReceipt.student?.stage,
        school: {
          id: reqForReceipt.student?.school?.id,
          name: reqForReceipt.student?.school?.name,
          logo: reqForReceipt.student?.school?.logo,
          userId: userForSchool?.id,
        },
        parent: {
          id: reqForReceipt.student?.parent?.id,
          fullName: reqForReceipt.student?.parent?.fullName,
          userId: reqForReceipt.student?.parent?.userId,
        },
      },
      deliveryPerson: reqForReceipt.deliveryPerson
        ? {
            id: reqForReceipt.deliveryPerson.id,
            fullName: reqForReceipt.deliveryPerson.fullName,
            profileImage: reqForReceipt.deliveryPerson.profileImage,
            user: {
              id: reqForReceipt.deliveryPerson.user?.id,
              email: reqForReceipt.deliveryPerson.user?.email,
              phoneNumber: reqForReceipt.deliveryPerson.user?.phoneNumber,
            },
          }
        : null,
      cancellationReason: reqForReceipt.cancellationReason,
      cancelledAt: reqForReceipt.cancelledAt,
      requestReason: reqForReceipt.requestReason,
      reminderCount: reqForReceipt.reminderCount || 0,
    };
  }
}
