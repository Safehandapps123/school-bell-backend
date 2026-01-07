import { ApiProperty } from '@nestjs/swagger';

export class SchoolStatusCount {
  @ApiProperty({ example: 142, description: 'Number of active schools' })
  active: number;

  @ApiProperty({ example: 14, description: 'Number of suspended schools' })
  suspended: number;

  @ApiProperty({ example: 3, description: 'Number of pending schools' })
  pending: number;
}

export class SchoolsByRegion {
  @ApiProperty({ example: 'الرياض', description: 'Region name' })
  region: string;

  @ApiProperty({ example: 45, description: 'Number of schools in region' })
  count: number;
}

export class RecentSchool {
  @ApiProperty({ example: 1, description: 'School ID' })
  id: number;

  @ApiProperty({ example: 'مدرسة التفوق الابتدائية', description: 'School name' })
  name: string;

  @ApiProperty({ example: 'الرياض، حي العليا', description: 'School location' })
  location: string;

  @ApiProperty({ example: 'https://example.com/logo.jpg', description: 'School logo' })
  logo: string;

  @ApiProperty({ example: 'active', description: 'School status' })
  status: string;

  @ApiProperty({ example: '2025-11-22T10:00:00Z', description: 'Creation date' })
  createdAt: Date;
}

export class SchoolDashboardDto {
  @ApiProperty({ example: 156, description: 'Total number of schools' })
  totalSchools: number;

  @ApiProperty({ example: 142, description: 'Number of active schools' })
  activeSchools: number;

  @ApiProperty({ example: 14, description: 'Number of suspended schools' })
  suspendedSchools: number;

  @ApiProperty({ example: 3, description: 'Number of pending schools' })
  pendingSchools: number;

  @ApiProperty({ example: 3, description: 'New schools this week' })
  newThisWeek: number;

  @ApiProperty({ example: 12, description: 'New schools this month' })
  newThisMonth: number;

  @ApiProperty({ example: 5, description: 'Schools activated today' })
  activatedToday: number;

  @ApiProperty({
    type: [RecentSchool],
    description: 'Recently added schools',
  })
  recentSchools: RecentSchool[];

  @ApiProperty({
    type: [SchoolsByRegion],
    description: 'Schools distribution by region',
  })
  schoolsByRegion: SchoolsByRegion[];
}
