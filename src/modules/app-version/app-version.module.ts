import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppVersionController } from './app-version.controller';
import { AppVersionService } from './app-version.service';
import { AppVersion } from './entities/app-version.entity';
import { CountriesData } from './entities/conteries-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppVersion, CountriesData])],
  controllers: [AppVersionController],
  providers: [AppVersionService],
  exports: [AppVersionService],
})
export class AppVersionModule {}
