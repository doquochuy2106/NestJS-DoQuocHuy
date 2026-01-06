import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { genSaltSync, hashSync } from "bcryptjs"

@Injectable()
export class UsersService {

  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  getHashPassWord = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash
  }

  async create(createUserDto: CreateUserDto) {
    let hasPassWord = this.getHashPassWord(createUserDto.password)

    let user = this.userModel.create({
      email: createUserDto.email,
      pasword: hasPassWord,
      name: createUserDto.name
    })
    return user
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found User'
    }

    let userById = await this.userModel.findById({
      _id: id
    })
    return userById
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    let userUpdate = await this.userModel.updateOne(
      {
        _id: id
      },
      {
        email: updateUserDto.email,
        name: updateUserDto.name
      })

    return userUpdate
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
