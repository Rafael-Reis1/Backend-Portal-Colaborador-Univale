import { User } from '../entities/user.entity';

export class CreateUserDto extends User {
  cpf: string;
  nome: string;
  cursoSetor: string[];
  cpfGestor: string[];
  tipoAtividade: string[];
  nomeGestor: string[];
  tipoFuncionario: string[];
  fluigUser: boolean;
}