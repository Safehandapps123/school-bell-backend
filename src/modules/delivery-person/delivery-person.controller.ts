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
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DeliveryPersonService } from './delivery-person.service';
import { CreateDeliveryPersonDto } from './dto/create-delivery-person.dto';
import { UpdateDeliveryPersonDto } from './dto/update-delivery-person.dto';
import { DeliveryPersonQueryDto } from './dto/delivery-person-query.dto';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';
import { Auth } from 'src/common/guards/auth.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { CurrentUser } from 'src/common/guards/user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Delivery Persons')
@Controller('delivery-person')
export class DeliveryPersonController {
  constructor(private readonly deliveryPersonService: DeliveryPersonService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profileImage', maxCount: 1 },
      { name: 'nationalIdFront', maxCount: 1 },
      { name: 'nationalIdBack', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
     type: CreateDeliveryPersonDto,
  })
  @ApiOperation({ summary: 'Create a new delivery person' })
  @Auth(RolesEnum.PARENT , RolesEnum.STUDENT)
  @SuccessResponse('Delivery person created successfully', 201)
  create(
    @Body() createDeliveryPersonDto: CreateDeliveryPersonDto,
    @CurrentUser() user: User,
    @UploadedFiles()
    files: {
      profileImage?: Express.Multer.File[];
      nationalIdFront?: Express.Multer.File[];
      nationalIdBack?: Express.Multer.File[];
    },
  ) {
    return this.deliveryPersonService.create(
      createDeliveryPersonDto,
      user,
      files?.profileImage?.[0],
      files?.nationalIdFront?.[0],
      files?.nationalIdBack?.[0],
    );
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Get all delivery persons with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated delivery persons' })
  findAll(@Query() query: DeliveryPersonQueryDto, @CurrentUser() user: User) {
    return this.deliveryPersonService.findAll(query, user);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get a delivery person by ID' })
  @ApiResponse({ status: 200, description: 'Returns the delivery person' })
  @ApiResponse({ status: 404, description: 'Delivery person not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryPersonService.findOne(id);
  }

  @Patch(':id')
  @Auth()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profileImage', maxCount: 1 },
      { name: 'nationalIdFront', maxCount: 1 },
      { name: 'nationalIdBack', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profileImage: { type: 'string', format: 'binary' },
        nationalIdFront: { type: 'string', format: 'binary' },
        nationalIdBack: { type: 'string', format: 'binary' },
        userId: { type: 'number' },
        fullName: { type: 'string' },
        nationalId: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Update a delivery person' })
  @ApiResponse({ status: 200, description: 'Delivery person updated successfully' })
  @ApiResponse({ status: 404, description: 'Delivery person not found' })
  @ApiResponse({ status: 409, description: 'National ID already exists' })
  @SuccessResponse('Delivery person updated successfully', 200)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeliveryPersonDto: UpdateDeliveryPersonDto,
    @UploadedFiles()
    files: {
      profileImage?: Express.Multer.File[];
      nationalIdFront?: Express.Multer.File[];
      nationalIdBack?: Express.Multer.File[];
    },
  ) {
    return this.deliveryPersonService.update(
      id,
      updateDeliveryPersonDto,
      files?.profileImage?.[0],
      files?.nationalIdFront?.[0],
      files?.nationalIdBack?.[0],
    );
  }

  @Delete(':id')
  @Auth()
  @ApiOperation({ summary: 'Delete a delivery person (soft delete)' })
  @SuccessResponse("delivery person deleted successfully" ,200)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryPersonService.remove(id);
  }
}
