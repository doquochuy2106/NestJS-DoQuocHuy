import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';
import ms from 'ms';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUserName(username);
    if (user) {
      const isValidPassWord = this.usersService.isValidPassWord(
        pass,
        user.pasword,
      );
      if (isValidPassWord) {
        return user;
      }
    }
    return null;
  }

  async login(user: IUser, response: Response) {
    const { _id, name, email, role } = user;
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id,
      name,
      email,
      role,
    };

    let refresh_token = this.createRefreshToken(payload);

    //update user with refresh_token
    await this.usersService.updateRefreshToken(refresh_token, _id);

    //set refreshtoken as cookies
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRES')) * 1000,
    });

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token,
      user: {
        _id,
        name,
        email,
        role,
      },
    };
  }

  async Register(registerUserDto: RegisterUserDto) {
    let register = await this.usersService.Register(registerUserDto);

    return {
      _id: register._id,
      createdAt: register.createdAt,
    };
  }

  createRefreshToken = (payload: any) => {
    let refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRES')) / 1000,
    });

    return refresh_token;
  };

  processRefreshtoken = async (refresh_token: string, response: Response) => {
    try {
      await this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });
      //todo
      let user = await this.usersService.findUserByRefreshToken(refresh_token);

      if (user) {
        const { _id, name, email, role } = user;
        const payload = {
          sub: 'token refresh',
          iss: 'from server',
          _id,
          name,
          email,
          role,
        };
        let refresh_token = this.createRefreshToken(payload);
        //update user with refresh_token
        await this.usersService.updateRefreshToken(
          refresh_token,
          _id.toString(),
        );
        //set refreshtoken as cookies
        response.clearCookie('refresh_token');
        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRES')),
        });
        return {
          access_token: this.jwtService.sign(payload),
          refresh_token,
          user: {
            _id,
            name,
            email,
            role,
          },
        };
      } else {
        throw new BadRequestException('Refresh Token co loi');
      }
    } catch (error) {
      throw new BadRequestException('Refresh Token không hợp lệ hoặc hết hạn');
    }
  };

  Logout = async (user: IUser, response: Response) => {
    await this.usersService.updateRefreshToken('', user._id);
    response.clearCookie('refresh_token');
    return 'ok';
  };
}
