import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ReqForReceiptService } from './req-for-receipt.service';
import { CreateReqForReceiptDto } from './dto/create-req-for-receipt.dto';
import { UpdateReqForReceiptDto } from './dto/update-req-for-receipt.dto';
import { ReqForReceiptQueryDto } from './dto/req-for-receipt-query.dto';
import { RequestStautsEnum } from './enums/request-status.enum';
import { Auth } from 'src/common/guards/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { CurrentUser } from 'src/common/guards/user.decorator';
import { User } from '../user/entities/user.entity';
import { SuccessResponse } from 'src/common/interceptors/success-response.interceptor';
import { NotificationService } from '../notification/notification.service';
import { NotificationTypeEnum } from '../notification/enums/notification-type.enum';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';

@ApiTags('Receipt Requests')
@Controller('req-for-receipt')
export class ReqForReceiptController {
  constructor(
    private readonly reqForReceiptService: ReqForReceiptService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new receipt request' })
  @ApiResponse({
    status: 201,
    description: 'Receipt request created successfully',
  })
  @Auth(RolesEnum.PARENT, RolesEnum.STUDENT)
  @SuccessResponse('تم إنشاء طلب الاستلام بنجاح', 201)
  async create(
    @Body() createReqForReceiptDto: CreateReqForReceiptDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.reqForReceiptService.create(
      createReqForReceiptDto,
      user,
    );
    await this.notificationService.sendNotification({
      notificationData: {
        title: 'تم إنشاء طلبك بنجاح',
        message: 'يمكنك متابعة حالة طلبك من خلال صفحة الطلبات',
        navigationData: {
          screen: 'receiptRequests',
          params: {
            id: result.id,
          },
        },
      },
      type: NotificationTypeEnum.Direct,
      target: {
        userIds: [user.id],
      },
    });

    if (createReqForReceiptDto.deliveryId) {
      await this.notificationService.sendNotification({
        notificationData: {
          title: 'تم اسناد طلب استلام لك',
          message: 'يمكنك متابعة حالة الطلب من خلال صفحة الطلبات',
          navigationData: {
            screen: 'receiptRequests',
            params: {
              id: result.id,
            },
          },
        },
        type: NotificationTypeEnum.Direct,
        target: {
          userIds: result.deliveryPerson?.user.id ? [result.deliveryPerson.user.id] : [],
        },
      });
    }

    if (result.student.school.userId) {
      await this.notificationService.sendNotification({
        notificationData: {
          title: 'طلب جديد',
          message:
            'لديك طلب استلام جديد يمكنك الاطلاع عليه من خلال صفحة الطلبات',
          navigationData: {
            screen: 'receiptRequests',
            params: {
              id: result.id,
            },
          },
        },
        type: NotificationTypeEnum.Direct,
        target: {
          userIds: [result.student.school.userId],
        },
      });
    }
    return result;
  }


  @Post('/add-fast-request/:id')
  @Auth(RolesEnum.PARENT, RolesEnum.STUDENT)
  @ApiOperation({ summary: 'Add or update a fast receipt request' })
  @ApiParam({ name: 'id', description: 'Student ID' })
  @ApiResponse({
    status: 201,
    description: 'Fast receipt request created or updated successfully',
  })
  @SuccessResponse('تم إضافة طلب الاستلام السريع بنجاح', 201)
  async addFastRequest(
    @Param('id') studentId: number,
    @CurrentUser() user: User,
  ) {
    return this.reqForReceiptService.addFastRequest(+studentId, user);
  }

  @Get('/home-request')
  @Auth(RolesEnum.PARENT, RolesEnum.STUDENT)
  @ApiOperation({ summary: 'Get last receipt request for home' })
  @SuccessResponse('Last home receipt request retrieved successfully', 200)
  async getLastHomeRequest(@CurrentUser() user: User) {
    return this.reqForReceiptService.getFastRequest(user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all receipt requests with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Receipt requests retrieved successfully',
  })
  @Auth()
  @SuccessResponse('Receipt requests retrieved successfully', 200)
  findAll(@Query() query: ReqForReceiptQueryDto, @CurrentUser() user: User) {
    return this.reqForReceiptService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a receipt request by ID' })
  @ApiParam({ name: 'id', description: 'Receipt request ID' })
  @ApiResponse({
    status: 200,
    description: 'Receipt request retrieved successfully',
  })
  @Auth()
  @SuccessResponse('Receipt request retrieved successfully', 200)
  findOne(@Param('id') id: string) {
    return this.reqForReceiptService.findOne(+id);
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Update a receipt request' })
  @ApiParam({ name: 'id', description: 'Receipt request ID' })
  @Auth()
  @SuccessResponse('تم تحديث حالة طلب الاستلام بنجاح', 200)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateRequestStatusDto,
    @CurrentUser() user: User,
  ) {
    const result = await this.reqForReceiptService.updateStatus(
      +id,
      body,
      user
    );
    return result;
  }

  @Patch(':id')
  @Auth()
  @ApiOperation({ summary: 'Update a receipt request' })
  @ApiParam({ name: 'id', description: 'Receipt request ID' })
  @ApiResponse({
    status: 200,
    description: 'Receipt request updated successfully',
  })
  @SuccessResponse('Receipt request updated successfully', 200)
  update(
    @Param('id') id: string,
    @Body() updateReqForReceiptDto: UpdateReqForReceiptDto,
  ) {
    return this.reqForReceiptService.update(+id, updateReqForReceiptDto);
  }

  @Delete(':id')
  @Auth()
  @ApiOperation({ summary: 'Delete a receipt request' })
  @ApiParam({ name: 'id', description: 'Receipt request ID' })
  @SuccessResponse('Receipt request deleted successfully', 200)
  remove(@Param('id') id: string) {
    return this.reqForReceiptService.remove(+id);
  }
}
