import { ApiProperty } from '@nestjs/swagger';

export class SchoolStatisticsDto {
  @ApiProperty({ example: 150, description: 'Total number of students' })
  totalStudents: number;

  @ApiProperty({ example: 25, description: 'Total number of delivery persons' })
  totalDeliveryPersons: number;

  @ApiProperty({ example: 80, description: 'Total number of parents' })
  totalParents: number;

  @ApiProperty({ example: 45, description: 'Total number of receipt requests' })
  totalRequests: number;

  @ApiProperty({ example: 12, description: 'Number of pending requests for today' })
  pendingRequestsToday: number;

  @ApiProperty({ example: 8, description: 'Number of delivered requests for today' })
  deliveredRequestsToday: number;

  @ApiProperty({ example: 3, description: 'Number of waiting outside requests for today' })
  waitingOutsideRequestsToday: number;

  @ApiProperty({ example: 2, description: 'Number of cancelled requests for today' })
  cancelledRequestsToday: number;
}
