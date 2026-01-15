import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
  ) {}

  getHashPassWord = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };

  async create(createUserDto: CreateUserDto) {
    let hasPassWord = this.getHashPassWord(createUserDto.password);

    let user = this.userModel.create({
      email: createUserDto.email,
      pasword: hasPassWord,
      name: createUserDto.name,
    });
    return user;
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found User';
    }

    let userById = await this.userModel.findById({
      _id: id,
    });
    return userById;
  }

  async findByUserName(username: string) {
    return await this.userModel.findOne({
      email: username,
    });
  }

  async isValidPassWord(password: string, hash: string) {
    return await compareSync(password, hash);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    let userUpdate = await this.userModel.updateOne(
      {
        _id: id,
      },
      {
        email: updateUserDto.email,
        name: updateUserDto.name,
      },
    );

    return userUpdate;
  }

  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found User';
    }
    return await this.userModel.softDelete({ _id: id });
  }
}
