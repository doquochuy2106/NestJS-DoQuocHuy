import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

class Company {
  @IsNotEmpty()
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  name: string;
}

export class CreateJobDto {
  @IsNotEmpty({ message: 'Name không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Skill không được để trống' })
  @IsArray({ message: 'Skill phải là một định dạng mảng' })
  @IsString({ each: true, message: 'Mỗi skill phải là một chuỗi' })
  skill: string[];

  @IsNotEmpty({ message: 'Logo không được để trống' })
  logo: string;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Company)
  company: Company;

  @IsNotEmpty({ message: 'Location không được để trống' })
  @IsString()
  location: string;

  @IsNotEmpty({ message: 'Salary không được để trống' })
  @IsNumber()
  salary: number;

  @IsNotEmpty({ message: 'Quantity không được để trống' })
  @IsNumber()
  quantity: number;

  @IsNotEmpty({ message: 'Level không được để trống' })
  @IsString()
  level: string;

  @IsNotEmpty({ message: 'Description không được để trống' })
  @IsString()
  description: string;

  // Sử dụng @Type để class-validator hiểu đây là Date object khi validate
  @IsNotEmpty({ message: 'StartDate không được để trống' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'StartDate phải là định dạng ngày' })
  startDate: Date;

  @IsNotEmpty({ message: 'endDate không được để trống' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'endDate phải là định dạng ngày' })
  endDate: Date;

  @IsNotEmpty({ message: 'isActive không được để trống' })
  @IsBoolean()
  isActive: boolean;
}
