import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppEnv } from '../../common/enums/app-env.enum';
import { PasswordService } from '../../common/helpers/encryption/password.service';
import { CustomI18nService } from '../../common/services/custom-i18n.service';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { ChangePasswordDto } from './dto/requests/change-password.dto';
import { LoginDto } from './dto/requests/login.dto';
import { UpdatePasswordDto } from './dto/requests/update-password.dto';
import { Tokens } from './interfaces/tokens.interface';
import { ParentSignUpDto } from './dto/requests/parent-sign-up.dto';
import { StudentSignUpDto } from './dto/requests/student-sign-up.dto';
import { SchoolSignUpDto } from './dto/requests/school-sign-up.dto';
import { randomBytes } from 'crypto';
import { Parent } from '../user/entities/parent.entity';
import { Student } from '../student/entities/student.entity';
import { School } from '../school/entities/school.entity';
import { FileUploadService } from '../../common/fileUpload/file-upload.service';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { DeliveryPerson } from '../delivery-person/entities/delivery-person.entity';
import { SchoolStatus } from '../school/enums/school-status.enum';

@Injectable()
export class AuthService {
  private appEnv: AppEnv;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,

    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,

    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,

    @InjectRepository(DeliveryPerson)
    private readonly deliveryPersonRepository: Repository<DeliveryPerson>,
    private readonly userService: UserService,
    private readonly emailVerificationService: EmailVerificationService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly i18n: CustomI18nService,
    private readonly passwordService: PasswordService,
    private readonly fileUploadService: FileUploadService,
  ) {
    this.appEnv = this.configService.getOrThrow<string>('app.env') as AppEnv;
  }

  async signupParent(
    signUpDto: ParentSignUpDto,
    profileImage?: Express.Multer.File,
    nationalIdFront?: Express.Multer.File,
    nationalIdBack?: Express.Multer.File,
  ) {
    let user = await this.userRepository.findOne({
      where: [
        { email: signUpDto.email },
        { phoneNumber: signUpDto.phoneNumber },
      ],
    });

    if (user) {
      throw new ConflictException(
        this.i18n.t('auth.USER_ALREADY_EXISTS', {
          email: signUpDto.email,
          phoneNumber: signUpDto.phoneNumber,
        }),
      );
    }

    const hashedPassword = await this.passwordService.hash(signUpDto.password);

    // Create parent profile with national ID images and full name
    const parentData: Partial<Parent> = {
      fullName: signUpDto.fullName,
      nationalId: signUpDto.nationalId,
    };

    // Upload profile image if provided
    if (profileImage) {
      const uploadedProfileImage =
        await this.fileUploadService.uploadImage(profileImage);
      parentData.profileImage = uploadedProfileImage;
    }

    // Upload national ID images if provided
    if (nationalIdFront) {
      const uploadedNationalIdFront =
        await this.fileUploadService.uploadImage(nationalIdFront);
      parentData.nationalIdFront = uploadedNationalIdFront;
    }

    if (nationalIdBack) {
      const uploadedNationalIdBack =
        await this.fileUploadService.uploadImage(nationalIdBack);
      parentData.nationalIdBack = uploadedNationalIdBack;
    }

    const parent = this.parentRepository.create(parentData);
    const savedParent = await this.parentRepository.save(parent);

    const newUser: Partial<User> = {
      email: signUpDto.email,
      phoneNumber: signUpDto.phoneNumber,
      password: hashedPassword,
      schoolId: signUpDto.schoolId,
      parentId: savedParent.id,
    };

    const createdUser = this.userRepository.create(newUser);
    const savedUser = await this.userRepository.save(createdUser);

    savedParent.userId = savedUser.id;
    await this.parentRepository.save(savedParent);

    await this.setPlayerIdForUser(savedUser, signUpDto.playerId);
    const tokens = await this.generateTokens(savedUser);
    return {
      id: savedUser.id,
      email: savedUser.email,
      ...tokens,
    };
  }

  async signupStudent(
    signUpDto: StudentSignUpDto,
    profileImage?: Express.Multer.File,
  ) {
    let user = await this.userRepository.findOne({
      where: [{ email: signUpDto.email }],
    });

    if (user) {
      throw new ConflictException(
        this.i18n.t('auth.USER_ALREADY_EXISTS', {
          email: signUpDto.email,
        }),
      );
    }

    const hashedPassword = await this.passwordService.hash(signUpDto.password);

    // Create user first
    const newUser: Partial<User> = {
      email: signUpDto.email,
      phoneNumber: signUpDto.phoneNumber,
      password: hashedPassword,
      schoolId: signUpDto.schoolId,
      role: RolesEnum.STUDENT,
    };

    user = this.userRepository.create(newUser);
    const savedUser = await this.userRepository.save(user);

    // Create student profile
    const studentData: Partial<Student> = {
      userId: savedUser.id,
      fullName: signUpDto.fullName,
      dateOfBirth: new Date(signUpDto.dateOfBirth),
      stage: signUpDto.stage,
      class: signUpDto.class,
      code: signUpDto.code,
      schoolId: signUpDto.schoolId,
      hasAccount: true,
    };

    // Upload profile image if provided
    if (profileImage) {
      const uploadedProfileImage =
        await this.fileUploadService.uploadImage(profileImage);
      studentData.profileImage = uploadedProfileImage;
    }

    const student = this.studentRepository.create(studentData);
    const savedStudent = await this.studentRepository.save(student);

    savedUser.studentId = savedStudent.id;
    await this.userRepository.save(savedUser);

    await this.setPlayerIdForUser(savedUser, signUpDto.playerId);
    const tokens = await this.generateTokens(savedUser);

    return {
      id: savedUser.id,
      email: savedUser.email,
      ...tokens,
    };
  }

  async signupSchool(signUpDto: SchoolSignUpDto, logo?: Express.Multer.File) {
    let user = await this.userRepository.findOne({
      where: [
        { email: signUpDto.email },
        { phoneNumber: signUpDto.phoneNumber },
      ],
    });

    if (user) {
      throw new ConflictException(
        this.i18n.t('auth.USER_ALREADY_EXISTS', {
          email: signUpDto.email,
          phoneNumber: signUpDto.phoneNumber,
        }),
      );
    }

    const hashedPassword = await this.passwordService.hash(signUpDto.password);

    // Create school profile
    const schoolData: Partial<School> = {
      name: signUpDto.name,
      description: signUpDto.description,
      location: signUpDto.location,
      stages: signUpDto.stages,
    };

    // Upload logo if provided
    if (logo) {
      const uploadedLogo = await this.fileUploadService.uploadImage(logo);
      schoolData.logo = uploadedLogo;
    }

    const school = this.schoolRepository.create(schoolData);
    const savedSchool = await this.schoolRepository.save(school);

    // Create user account
    const newUser: Partial<User> = {
      email: signUpDto.email,
      phoneNumber: signUpDto.phoneNumber,
      password: hashedPassword,
      schoolId: savedSchool.id,
      role: RolesEnum.SCHOOL,
    };

    const createdUser = this.userRepository.create(newUser);
    const savedUser = await this.userRepository.save(createdUser);

    await this.setPlayerIdForUser(savedUser, signUpDto.playerId);
    const tokens = await this.generateTokens(savedUser);

    return {
      id: savedUser.id,
      email: savedUser.email,
      schoolId: savedSchool.id,
      schoolName: savedSchool.name,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :identifier', {
        identifier: loginDto.identifier.trim(),
      })
      .orWhere('user.phoneNumber = :identifier', {
        identifier: loginDto.identifier.trim(),
      })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException(this.i18n.t('auth.USER_NOT_FOUND'));
    }
    if( user.role === RolesEnum.SCHOOL) {
      const school = await this.schoolRepository.findOne({
        where: { id: user.schoolId },
        select: ['id', 'status'],
      });
      if (school?.status === SchoolStatus.INACTIVE) {
        throw new UnauthorizedException(this.i18n.t('auth.SCHOOL_SUSPENDED'));
      }
    }

    const isPasswordValid = await this.passwordService.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(this.i18n.t('auth.INVALID_CREDENTIALS'));
    }

    // if (!user.isEmailVerified) {
    //   this.emailVerificationService.sendVerificationCode(user);
    //   return {
    //     isEmailVerified: false,
    //     email: user.email,
    //     accessToken: null,
    //     refreshToken: null,
    //     token_type: null,
    //     refresh_expires_in: null,
    //     expires_in: null,
    //   };
    // }

    const tokens = await this.generateTokens(user);

    await this.setPlayerIdForUser(user, loginDto.playerId);

    return {
      isEmailVerified: user.isEmailVerified,
      email: user.email,
      role: user.role,
      ...tokens,
    };
  }

  async generateTokens(user: User): Promise<Tokens> {
    const jti = randomBytes(16).toString('hex');

    const payload = { sub: user.id, email: user.email, jti };

    const expiresIn = '100y';
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT.secret'),
      expiresIn,
    });

    const userEntity = await this.userRepository.findOne({
      where: { id: user.id },
      select: ['id', 'whitelistedTokens'],
    });

    const updatedWhitelist = [
      jti,
      ...(userEntity?.whitelistedTokens || []),
    ].slice(0, 5);

    await this.userRepository.update(user.id, {
      whitelistedTokens: updatedWhitelist,
    });

    return {
      accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
    };
  }

  async getMe(id: number) {
    const user = await this.userService.findOne(id);
    return user;
  }

  async updatePassword(body: UpdatePasswordDto) {
    await this.emailVerificationService.verifyEmail({
      email: body.email,
      otpCode: body.otpAgin,
    });
    const user = await this.userRepository.findOne({
      where: { email: body.email },
    });
    if (!user) {
      throw new NotFoundException(this.i18n.t('auth.USER_NOT_FOUND'));
    }
    const newPassword = await this.passwordService.hash(body.newPassword);
    user.password = newPassword;
    await this.userRepository.save(user);
    return user;
  }

  async setPlayerIdForUser(
    user: User,
    playerId: string = 'string',
  ): Promise<User> {
    // Initialize playerIds array if it doesn't exist
    if (!user.playerIds) {
      user.playerIds = [];
    }

    // Remove the playerId if it already exists (to avoid duplicates)
    user.playerIds = user.playerIds.filter((id) => id !== playerId);
    user.playerIds = user.playerIds.filter((id) => id !== playerId);

    // Add the new playerId to the beginning of the array
    user.playerIds.unshift(playerId);

    // Ensure we only keep the 3 most recent player IDs
    if (user.playerIds.length > 3) {
      user.playerIds = user.playerIds.slice(0, 3);
    }

    // Save the updated user
    return await this.userRepository.save(user);
  }

  async changePassword(body: ChangePasswordDto, userId: number): Promise<void> {
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!currentUser) {
      throw new NotFoundException(this.i18n.t('auth.USER_NOT_FOUND'));
    }

    const isCurrentPasswordValid = await this.passwordService.compare(
      body.currentPassword,
      currentUser.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException(this.i18n.t('auth.INVALID_CREDENTIALS'));
    }

    if (body.newPassword !== body.confirmNewPassword) {
      throw new ConflictException(this.i18n.t('auth.PASSWORDS_DO_NOT_MATCH'));
    }

    if (body.newPassword === body.currentPassword) {
      throw new ConflictException(this.i18n.t('auth.NEW_PASSWORD_SAME_AS_OLD'));
    }

    const newPasswordHash = await this.passwordService.hash(body.newPassword);
    currentUser.password = newPasswordHash;

    await this.userRepository.save(currentUser);
  }

  async deleteAccount(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(this.i18n.t('auth.USER_NOT_FOUND'));
    }
    switch (user.role) {
      case RolesEnum.PARENT:
        await this.parentRepository.softDelete({ userId: user.id });
        break;
      case RolesEnum.STUDENT:
        await this.studentRepository.softDelete({ userId: user.id });
        break;
      case RolesEnum.SCHOOL:
        await this.schoolRepository.softDelete({ id: user.schoolId });
        break;
      case RolesEnum.DELIVERY_PERSON:
        await this.deliveryPersonRepository.softDelete({ userId: user.id });
        break;
    }
    await this.userRepository.softDelete(userId);
  }

  async logout(userId: number, token: string): Promise<void> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('JWT.secret'),
      });

      if (decoded.sub !== userId) {
        throw new UnauthorizedException(this.i18n.t('auth.INVALID_TOKEN'));
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'whitelistedTokens'],
      });

      if (!user) {
        throw new NotFoundException(this.i18n.t('auth.USER_NOT_FOUND'));
      }

      const updatedWhitelist = (user.whitelistedTokens || []).filter(
        (jti) => jti !== decoded.jti,
      );

      await this.userRepository.update(userId, {
        whitelistedTokens: updatedWhitelist,
      });
    } catch (error) {
      throw new UnauthorizedException(this.i18n.t('auth.INVALID_TOKEN'));
    }
  }

  async validateToken(payload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: [
        'id',
        'email',
        'whitelistedTokens',
        'role',
        'schoolId',
        'parentId',
        'deliveryPersonId',
        'studentId',
      ],
    });

    if (!user) {
      throw new UnauthorizedException(this.i18n.t('auth.USER_NOT_FOUND'));
    }

    // whitelist check
    if (!user.whitelistedTokens?.includes(payload.jti)) {
      throw new UnauthorizedException(
        this.i18n.t('auth.TOKEN_EXPIRED_OR_REVOKED'),
      );
    }

    return {
      ...user,
      id: user.id,
    };
  }

  async cleanupWhitelistedTokens(): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ whitelistedTokens: [] })
      .where('lastLoginAt < :cutoffDate', {
        cutoffDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      }) // مثلاً بعد 90 يوم
      .execute();
  }

  async logoutFromAllDevices(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      whitelistedTokens: [],
    });
  }
}
