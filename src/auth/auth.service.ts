import { HttpException, HttpStatus, Injectable, Res } from '@nestjs/common';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/user.service';
import { UserPayload } from './models/UserPayload';
import { JwtService } from '@nestjs/jwt';
import { UserToken } from './models/UserToken';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService, private readonly jwtService: JwtService) {}

    login(user: User): UserToken {
        const payload: UserPayload = {
            cpf: user.cpf,
            nome: user.nome,
            cursoSetor: user.cursoSetor,
            cpfGestor: user.cpfGestor,
            tipoAtividade: user.tipoAtividade,
            tipoFuncionario: user.tipoFuncionario,
            nomeGestor: user.nomeGestor,
            isGestor: user.isGestor
        }
        
        const jwtToken = this.jwtService.sign(payload);

        return {
            access_token: jwtToken
        }
    }

    async validateUser(cpf: string, password: string, data: CreateUserDto) {
        const user = await this.userService.validateRM(cpf, password);
        const isGestor = await this.userService.getGestor(cpf);

        const resultado = user.data.Resultado;
        const SECAO = [];
        const CPF_GESTOR = [];
        const TIPO_ATIVIDADE = [];
        const FUNCAO = [];
        const GESTOR_SECAO = [];
        const tipoFuncionario = [];

        resultado.forEach(Resultado => {
            if(Resultado.SITUCAO_FUNC[0] == 'Ativo') {
                SECAO.push(Resultado.SECAO[0]);
                CPF_GESTOR.push(Resultado.CPF_GESTOR[0]);
                TIPO_ATIVIDADE.push(Resultado.TIPO_ATIVIDADE[0]);
                FUNCAO.push(Resultado.FUNCAO[0]);
                GESTOR_SECAO.push(Resultado.GESTOR_SECAO[0]);
                tipoFuncionario.push(Resultado.FUNCAO[0]);
            }
        });

        data.cpf = cpf;
        data.nome = user.data.Resultado[0].NOME[0];
        data.cursoSetor = SECAO;
        data.cpfGestor = CPF_GESTOR;
        data.tipoAtividade = TIPO_ATIVIDADE;
        data.tipoFuncionario = tipoFuncionario;
        data.nomeGestor = GESTOR_SECAO;
        data.isGestor = isGestor;

        if (user.statusCode == 200) {
            await this.userService.createUser(data);
            
            return data;
        }

        throw new HttpException('cpf or password provided is incorrect.', HttpStatus.UNAUTHORIZED);
    }
}
