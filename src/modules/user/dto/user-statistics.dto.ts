export class UserStatisticsDto {
    totalUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    phoneVerifiedUsers: number;
    usersBlockedCount: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    activeUsersLast30Days: number;
    usersWithAddresses: number;
    usersWithCart: number;
    usersWithNotifications: number;
    avgUsersPerDay: number;
}

export class RoleDistributionDto {
    role: string;
    count: number;
    percentage: number;
}

export class GenderDistributionDto {
    gender: string;
    count: number;
    percentage: number;
}

export class UserActivityDto {
    activity: string;
    count: number;
    date?: Date;
}

export class UserDashboardResponseDto {
    statistics: UserStatisticsDto;
    roleDistribution: RoleDistributionDto[];
    genderDistribution: GenderDistributionDto[];
    recentActivities: UserActivityDto[];
    growthTrend: { date: string; count: number }[];
}