import { RolesEnum } from "src/common/enums/roles.enum";
import { IsEmail, IsEnum, IsNotEmpty, MinLength } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    fullName: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsEnum(RolesEnum)
    role: RolesEnum;
}