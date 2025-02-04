export interface UserPayload {
    //sub: number; (id do usuario)
    cpf: string;
    nome: string;
    cursoSetor: string[];
    cpfGestor: string[];
    tipoAtividade: string[];
    tipoFuncionario: string[];
    nomeGestor: string[];
    iat?: number;
    exp?: number;
}