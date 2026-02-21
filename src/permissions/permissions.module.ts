import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Resume, ResumeSchema } from 'src/resumes/schemas/resume.schema';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService],
  imports: [
    MongooseModule.forFeature([{ name: Resume.name, schema: ResumeSchema }]),
  ],
})
export class PermissionsModule {}
