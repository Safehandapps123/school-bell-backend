import { RolesEnum } from "src/common/enums/roles.enum";

export class UpdateUserDto {
    fullName?: string;
    password?: string;
    role?: RolesEnum;
    email?: string;
}
