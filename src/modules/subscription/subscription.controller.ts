import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { SubscribePlanDto } from './dto/subscribe-plan.dto';
import { PlanQueryDto } from './dto/plan-query.dto';
import { SubscriptionQueryDto } from './dto/subscription-query.dto';
import { Auth } from '../../common/guards/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { RolesEnum } from '../../common/enums/roles.enum';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ========== Plan Management (Admin Only) ==========

  @Post('plans')
  @Auth(RolesEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'إنشاء خطة اشتراك جديدة (للمسؤول فقط)' })
  @ApiResponse({
    status: 201,
    description: 'تم إنشاء الخطة بنجاح',
    schema: {
      example: {
        id: 1,
        name: 'الخطة الأساسية',
        description: 'خطة مناسبة للمدارس الصغيرة',
        price: 99.99,
        duration: 30,
        maxStudents: 100,
        maxDeliveryPersons: 10,
        features: ['إشعارات غير محدودة', 'تقارير متقدمة', 'دعم فني 24/7'],
        isActive: true,
        createdAt: '2025-11-28T10:00:00.000Z',
      },
    },
  })
  @SuccessResponse('Plan created successfully', 201)
  createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.subscriptionService.createPlan(createPlanDto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'عرض جميع خطط الاشتراك' })
  @ApiResponse({
    status: 200,
    description: 'قائمة خطط الاشتراك',
  })
  @SuccessResponse('Plans retrieved successfully' , 200)
  findAllPlans(@Query() query: PlanQueryDto) {
    return this.subscriptionService.findAllPlans(query);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'عرض تفاصيل خطة محددة' })
  @ApiResponse({
    status: 200,
    description: 'تفاصيل الخطة',
  })
  @ApiResponse({
    status: 404,
    description: 'الخطة غير موجودة',
  })
  @SuccessResponse('Plan retrieved successfully', 200)
  findOnePlan(@Param('id') id: string) {
    return this.subscriptionService.findOnePlan(+id);
  }

  @Patch('plans/:id')
  @Auth(RolesEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'تحديث خطة اشتراك (للمسؤول فقط)' })
  @ApiResponse({
    status: 200,
    description: 'تم تحديث الخطة بنجاح',
  })
  @ApiResponse({
    status: 404,
    description: 'الخطة غير موجودة',
  })
  @SuccessResponse('Plan updated successfully', 200)
  updatePlan(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.subscriptionService.updatePlan(+id, updatePlanDto);
  }

  @Delete('plans/:id')
  @Auth(RolesEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'حذف خطة اشتراك (للمسؤول فقط)' })
  @ApiResponse({
    status: 200,
    description: 'تم حذف الخطة بنجاح',
  })
  @ApiResponse({
    status: 404,
    description: 'الخطة غير موجودة',
  })
  @ApiResponse({
    status: 400,
    description: 'لا يمكن حذف خطة عليها اشتراكات نشطة',
  })
  @SuccessResponse('Plan deleted successfully', 200)
  removePlan(@Param('id') id: string) {
    return this.subscriptionService.removePlan(+id);
  }

  // ========== School Subscription Management ==========

  @Post('subscribe')
  @Auth(RolesEnum.SCHOOL)
  @ApiOperation({ summary: 'الاشتراك في خطة (للمدرسة فقط)' })
  @ApiResponse({
    status: 201,
    description: 'تم الاشتراك بنجاح',
    schema: {
      example: {
        id: 1,
        schoolId: 1,
        schoolName: 'مدرسة النور',
        plan: {
          id: 1,
          name: 'الخطة الأساسية',
          price: 99.99,
          duration: 30,
          features: ['إشعارات غير محدودة', 'تقارير متقدمة'],
        },
        startDate: '2025-11-28T10:00:00.000Z',
        endDate: '2025-12-28T10:00:00.000Z',
        status: 'active',
        paidAmount: 99.99,
        paymentMethod: 'credit_card',
        autoRenew: false,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'المدرسة لديها اشتراك نشط بالفعل',
  })
  @SuccessResponse('Subscribed to plan successfully', 201)
  subscribeToPlan(
    @Body() subscribePlanDto: SubscribePlanDto,
    @CurrentUser() user: User,
  ) {
    return this.subscriptionService.subscribeToPlan(subscribePlanDto, user);
  }

  @Get('my-subscription')
  @Auth(RolesEnum.SCHOOL)
  @ApiOperation({ summary: 'عرض اشتراكي الحالي (للمدرسة فقط)' })
  @ApiResponse({
    status: 200,
    description: 'تفاصيل الاشتراك الحالي',
    schema: {
      example: {
        hasSubscription: true,
        subscription: {
          id: 1,
          plan: {
            name: 'الخطة الأساسية',
            price: 99.99,
          },
          startDate: '2025-11-28T10:00:00.000Z',
          endDate: '2025-12-28T10:00:00.000Z',
          status: 'active',
        },
      },
    },
  })
  @SuccessResponse('My subscription retrieved successfully', 200)
  getMySubscription(@CurrentUser() user: User) {
    return this.subscriptionService.getMySubscription(user);
  }

  @Get('subscriptions')
  @Auth(RolesEnum.SUPER_ADMIN, RolesEnum.SCHOOL)
  @ApiOperation({
    summary: 'عرض جميع الاشتراكات (المسؤول يرى الكل، المدرسة ترى اشتراكاتها)',
  })
  @ApiResponse({
    status: 200,
    description: 'قائمة الاشتراكات',
  })
  @SuccessResponse('Subscriptions retrieved successfully', 200)
  findAllSubscriptions(
    @Query() query: SubscriptionQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.subscriptionService.findAllSubscriptions(query, user);
  }

  @Get('subscriptions/:id')
  @Auth(RolesEnum.SUPER_ADMIN, RolesEnum.SCHOOL)
  @ApiOperation({ summary: 'عرض تفاصيل اشتراك محدد' })
  @ApiResponse({
    status: 200,
    description: 'تفاصيل الاشتراك',
  })
  @ApiResponse({
    status: 404,
    description: 'الاشتراك غير موجود',
  })
  @SuccessResponse('Subscription retrieved successfully', 200)
  findOneSubscription(@Param('id') id: string) {
    return this.subscriptionService.findOneSubscription(+id);
  }

  @Patch('subscriptions/:id/cancel')
  @Auth(RolesEnum.SUPER_ADMIN, RolesEnum.SCHOOL)
  @ApiOperation({
    summary: 'إلغاء اشتراك (المدرسة تلغي اشتراكها، المسؤول يلغي أي اشتراك)',
  })
  @ApiResponse({
    status: 200,
    description: 'تم إلغاء الاشتراك بنجاح',
  })
  @ApiResponse({
    status: 404,
    description: 'الاشتراك غير موجود',
  })
  @SuccessResponse('Subscription cancelled successfully', 200)
  cancelSubscription(@Param('id') id: string, @CurrentUser() user: User) {
    return this.subscriptionService.cancelSubscription(+id, user);
  }
}
