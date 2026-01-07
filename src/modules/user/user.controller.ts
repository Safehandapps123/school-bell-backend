import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger/dist/decorators/api-use-tags.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { SuccessResponse } from '../../common/interceptors/success-response.interceptor';
import { UserQueryDto } from './dto/requests/find-user-query.dto';
import { ParentQueryDto } from './dto/requests/parent-query.dto';
import { PaginatedUserResponseDto } from './dto/responses/paginated-users.response.dto';
import { UserService } from './user.service';
import { CurrentUser } from 'src/common/guards/user.decorator';
import { User } from './entities/user.entity';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { CreateUserDto } from './dto/requests/create-user.dto';
import { Auth } from 'src/common/guards/auth.decorator';


@ApiTags('user')
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @ApiOperation({ summary: 'vendor owner' })
  @SuccessResponse('User created successfully', 201)
  async create(@Body() userDto: CreateUserDto, @CurrentUser() user: User) {
    return this.userService.create(userDto);
  }

  @Patch("/:id")
  @ApiOperation({ summary: 'vendor owner' })
  @SuccessResponse('User updated successfully', 200)
  async update(@Body() userDto: CreateUserDto,@Param('id') id: string  , @CurrentUser() user: User) {
    return this.userService.update(+id, userDto);
  }


  @Get()
  @ApiOperation({ summary: 'Super Admin And Vendor Owner' })
  @SuccessResponse('User list retrieved successfully', 200)
  @Serialize(PaginatedUserResponseDto)
  findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get('parents')
  @Auth()
  @SuccessResponse('Parents retrieved successfully', 200)
  findAllParents(@Query() query: ParentQueryDto, @CurrentUser() user: User) {
    return this.userService.findAllParents(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Super Admin And Vendor Owner' })
  @SuccessResponse('User retrieved successfully', 200)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id/toggle-block')
  @ApiOperation({ summary: 'Super Admin' })
  @SuccessResponse('User block status toggled successfully', 200)
  toggleBlockUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.toggleBlockUser(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Super Admin' })
  @SuccessResponse('User deleted successfully', 200)
  remove(@Param('id', ParseIntPipe) id: number , @CurrentUser() user: User) {
    return this.userService.deleteUserById(id , user);
  }

}
