import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from './users.interface';
import aqp from 'api-query-params';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { USER_ROLE } from 'src/databases/sample';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,

    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  getHashPassWord = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };

  async create(createUserDto: CreateUserDto, user: IUser) {
    let hasPassWord = this.getHashPassWord(createUserDto.password);

    let users = this.userModel.create({
      name: createUserDto.name,
      email: createUserDto.email,
      pasword: hasPassWord,
      age: createUserDto.age,
      gender: createUserDto.gender,
      address: createUserDto.address,
      role: createUserDto.role,
      company: createUserDto.company,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
    return users;
  }

  async findAll(page: number, limit: number, queryString: string) {
    const { filter, sort, projection, population } = aqp(queryString);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+page - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .select('-password')
      .populate(population)
      .exec();

    return {
      meta: {
        current: page, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems, // tổng số phần tử (số bản ghi)
      },
      result, //kết quả query
    };
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return 'Not found User';
    }

    let userById = await this.userModel
      .findById({
        _id: id,
      })
      .select('-password')
      .populate({ path: 'role', select: { name: 1, _id: 1 } });
    return userById;
  }

  async findByUserName(username: string) {
    return await this.userModel
      .findOne({
        email: username,
      })
      .populate({ path: 'role', select: { name: 1 } });
  }

  async isValidPassWord(password: string, hash: string) {
    return await compareSync(password, hash);
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: IUser) {
    let foundUser = await this.userModel.findOne({ _id: id });
    if (foundUser.email === 'admin@gmail.com') {
      throw new BadRequestException('Không thể xỏa tài khoản admin@gmail.com');
    }
    let userUpdate = await this.userModel.updateOne(
      {
        _id: id,
      },
      {
        name: updateUserDto.name,
        email: updateUserDto.email,
        age: updateUserDto.age,
        gender: updateUserDto.gender,
        address: updateUserDto.address,
        role: updateUserDto.role,
        company: updateUserDto.company,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );

    return userUpdate;
  }

  async remove(id: string, user: IUser) {
    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //   return 'Not found User';
    // }
    await this.userModel.findOne(
      {
        _id: id,
      },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );

    return await this.userModel.softDelete({ _id: id });
  }

  async Register(registerUserDto: RegisterUserDto) {
    let hasPassWord = this.getHashPassWord(registerUserDto.password);
    let isExits = this.userModel.findOne({ email: registerUserDto.email });
    if (isExits) {
      throw new BadRequestException('Email đã tồn tại trên hệ thống');
    }

    //fetch user role
    const userRole = await this.roleModel.findOne({ name: USER_ROLE });

    let register = await this.userModel.create({
      name: registerUserDto.name,
      email: registerUserDto.email,
      pasword: hasPassWord,
      age: registerUserDto.age,
      gender: registerUserDto.gender,
      adress: registerUserDto.address,
      role: userRole?._id,
    });
    return register;
  }

  updateRefreshToken = async (refreshToken: string, _id: string) => {
    return await this.userModel.updateOne(
      {
        _id: _id,
      },
      {
        refreshToken: refreshToken,
      },
    );
  };

  findUserByRefreshToken = async (refreshToken: string) => {
    return await this.userModel
      .findOne({
        refreshToken: refreshToken,
      })
      .populate({ path: 'role', select: { name: 1 } });
  };
}
