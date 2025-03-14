import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { UserPayload } from '../models/UserPayload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: UserPayload) {
    return {
      cpf: payload.cpf,
      nome: payload.nome,
      cursoSetor: payload.cursoSetor,
      cpfGestor: payload.cpfGestor,
      tipoAtividade: payload.tipoAtividade,
      tipoFuncionario: payload.tipoFuncionario,
      nomeGestor: payload.nomeGestor,
      isGestor: payload.isGestor
    }
  }
}