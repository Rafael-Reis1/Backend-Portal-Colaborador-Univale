import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'cpf' });
  }

  async validate(cpf: string, password: string, data: CreateUserDto) {
    return await this.authService.validateUser(cpf, password, data);
  }
}