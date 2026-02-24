import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { IUser } from 'src/users/users.interface';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  async create(createRoleDto: CreateRoleDto, user: IUser) {
    const { name, description, isActive, permissions } = createRoleDto;
    const isExist = await this.roleModel.findOne({ name });
    if (isExist) {
      throw new BadRequestException(`tên Role đã tồn tại`);
    }
    let role = await this.roleModel.create({
      name: name,
      description: description,
      isActive: isActive,
      permissions: permissions,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
    return {
      _id: role._id,
      createdAt: role.createdAt,
    };
  }

  async findAll(page: number, limit: number, querystring: string) {
    const { filter, sort, projection, population } = aqp(querystring);
    delete filter.current;
    delete filter.pageSize;

    let offset = (+page - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.roleModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.roleModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)

      .populate(population)
      .select(projection as any)
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
      throw new BadRequestException('not found role');
    }

    return (await this.roleModel.findById(id)).populate({
      path: 'permissions',
      select: { _id: 1, name: 1, method: 1, module: 1 },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    const { name, description, isActive, permissions } = updateRoleDto;
    // const isExist = await this.roleModel.findOne({ name });
    // if (isExist) {
    //   throw new BadRequestException(`tên Role đã tồn tại`);
    // }
    return await this.roleModel.updateOne(
      {
        _id: id,
      },
      {
        ...updateRoleDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
  }

  async remove(id: string, user: IUser) {
    let foundRole = await this.roleModel.findOne({ _id: id });
    if (foundRole.name === 'ADMIN') {
      throw new BadRequestException('Không thể xóa Role ADMIN');
    }
    await this.roleModel.updateOne({
      _id: id,
      deletedBy: {
        _id: user._id,
        email: user.email,
      },
    });
    return await this.roleModel.softDelete({
      _id: id,
    });
  }
}
