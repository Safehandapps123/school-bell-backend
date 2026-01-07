import { Body, Controller, Get, Put } from '@nestjs/common';
import { AppVersionService } from './app-version.service';
import { UpdateVersionDto } from './dto/update-app-version.dto';

@Controller('app-version')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get('check')
  async checkVersion() {
    return this.appVersionService.checkVersion();
  }

  @Put('update')
  async updateVersion(@Body() updateVersionDto: UpdateVersionDto) {
    return this.appVersionService.updateVersion(updateVersionDto);
  }

  @Get('countries-data')
  async getAllCountries() {
    return this.appVersionService.getAllCountries();
  }
}
