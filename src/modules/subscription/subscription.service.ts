import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { SubscribePlanDto } from './dto/subscribe-plan.dto';
import { PlanQueryDto } from './dto/plan-query.dto';
import { SubscriptionQueryDto } from './dto/subscription-query.dto';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { SchoolSubscription } from './entities/school-subscription.entity';
import { School } from '../school/entities/school.entity';
import { User } from '../user/entities/user.entity';
import { PaginationService } from '../../common/utils/pagination.utils';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { RolesEnum } from '../../common/enums/roles.enum';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,

    @InjectRepository(SchoolSubscription)
    private readonly subscriptionRepository: Repository<SchoolSubscription>,

    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  // ========== Plan Management (Admin Only) ==========

  async createPlan(createPlanDto: CreatePlanDto) {
    const plan = this.planRepository.create(createPlanDto);
    const saved = await this.planRepository.save(plan);
    return this.findOnePlan(saved.id);
  }

  async findAllPlans(query: PlanQueryDto) {
    const { isActive } = query;

    const queryBuilder = this.planRepository.createQueryBuilder('plan');

    if (isActive !== undefined) {
      queryBuilder.andWhere('plan.isActive = :isActive', { isActive });
    }

    const result =
      await PaginationService.paginateQueryBuilder<SubscriptionPlan>(
        queryBuilder,
        {
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
          basePath: 'subscription/plans',
          defaultSortColumn: 'plan.createdAt',
        },
      );

    return result;
  }

  async findOnePlan(id: number) {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  async updatePlan(id: number, updatePlanDto: UpdatePlanDto) {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    Object.assign(plan, updatePlanDto);
    await this.planRepository.save(plan);

    return this.findOnePlan(id);
  }

  async removePlan(id: number): Promise<void> {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // Check if plan has active subscriptions
    const activeSubscriptions = await this.subscriptionRepository.count({
      where: { planId: id, status: SubscriptionStatus.ACTIVE },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        'Cannot delete plan with active subscriptions',
      );
    }

    await this.planRepository.softDelete(id);
  }

  // ========== School Subscription Management ==========

  async subscribeToPlan(subscribePlanDto: SubscribePlanDto, user: User) {
    if (user.role !== RolesEnum.SCHOOL) {
      throw new BadRequestException('Only schools can subscribe to plans');
    }

    const school = await this.schoolRepository.findOne({
      where: { id: user.schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const plan = await this.planRepository.findOne({
      where: { id: subscribePlanDto.planId, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found or inactive');
    }

    // Check for active subscription
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        schoolId: user.schoolId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (activeSubscription) {
      throw new BadRequestException(
        'School already has an active subscription. Please cancel it first.',
      );
    }

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration);

    const paymentReference = this.generatePaymentReference();

    const subscription = this.subscriptionRepository.create({
      schoolId: user.schoolId,
      planId: plan.id,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
      paidAmount: plan.price,
      paymentMethod: subscribePlanDto.paymentMethod,
      paymentReference,
      autoRenew:  false,
    });

    const saved = await this.subscriptionRepository.save(subscription);
    return this.findOneSubscription(saved.id);
  }

  async findAllSubscriptions(query: SubscriptionQueryDto, user: User) {
    const { status, schoolId, planId } = query;

    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.school', 'school')
      .leftJoinAndSelect('subscription.plan', 'plan');

    // Role-based filtering
    if (user.role === RolesEnum.SCHOOL) {
      queryBuilder.andWhere('subscription.schoolId = :schoolId', {
        schoolId: user.schoolId,
      });
    } else if (schoolId) {
      queryBuilder.andWhere('subscription.schoolId = :schoolId', { schoolId });
    }

    if (status) {
      queryBuilder.andWhere('subscription.status = :status', { status });
    }

    if (planId) {
      queryBuilder.andWhere('subscription.planId = :planId', { planId });
    }

    const result =
      await PaginationService.paginateQueryBuilder<SchoolSubscription>(
        queryBuilder,
        {
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
          basePath: 'subscription/subscriptions',
          defaultSortColumn: 'subscription.createdAt',
        },
      );

    const items = result.items.map((subscription) =>
      this.formatSubscriptionResponse(subscription),
    );

    return {
      ...result,
      items,
    };
  }

  async findOneSubscription(id: number) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['school', 'plan'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return this.formatSubscriptionResponse(subscription);
  }

  async getMySubscription(user: User) {
    if (user.role !== RolesEnum.SCHOOL) {
      throw new BadRequestException('Only schools can access subscriptions');
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: {
        schoolId: user.schoolId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
    });

    if (!subscription) {
      return {
        hasSubscription: false,
        subscription: null,
      };
    }

    return {
      hasSubscription: true,
      subscription: this.formatSubscriptionResponse(subscription),
    };
  }

  async cancelSubscription(id: number, user: User) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // Only allow school to cancel their own subscription or admin
    if (
      user.role === RolesEnum.SCHOOL &&
      subscription.schoolId !== user.schoolId
    ) {
      throw new BadRequestException('Cannot cancel other school subscriptions');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    await this.subscriptionRepository.save(subscription);

    return this.findOneSubscription(id);
  }

  async isSchoolSubscriptionActive(schoolId: number) {
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        schoolId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    return !!activeSubscription;
  }

  private formatSubscriptionResponse(subscription: SchoolSubscription) {
    return {
      id: subscription.id,
      schoolId: subscription.schoolId,
      schoolName: subscription.school?.name,
      schoolLogo: subscription.school?.logo,
      plan: {
        id: subscription.plan?.id,
        name: subscription.plan?.name,
        description: subscription.plan?.description,
        price: subscription.plan?.price,
        duration: subscription.plan?.duration,
        maxStudents: subscription.plan?.maxStudents,
        maxDeliveryPersons: subscription.plan?.maxDeliveryPersons,
        features: subscription.plan?.features,
      },
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      status: subscription.status,
      paidAmount: subscription.paidAmount,
      paymentMethod: subscription.paymentMethod,
      paymentReference: subscription.paymentReference,
      autoRenew: subscription.autoRenew,
      createdAt: subscription.createdAt,
    };
  }

  private generatePaymentReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SUB-${timestamp}-${randomStr}`;
  }
}
