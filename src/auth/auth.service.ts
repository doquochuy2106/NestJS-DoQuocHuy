import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

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
}
