import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/database/PrismaService';
import * as xml2js from 'xml2js';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  private axiosInstance: any;
  private parser: xml2js.Parser;
  constructor(private readonly prisma: PrismaService) {
    this.parser = new xml2js.Parser();
  }
  
  async createUser(data: CreateUserDto) {
    const userExist = await this.prisma.user.findFirst({
      where: {
        cpf: data.cpf
      }
    })

    if(!userExist) {
      return await this.prisma.user.create({data: {
        cpf: data.cpf,
        name: data.nome,
        lastLogin: new Date()
      }});
    }

    return await this.prisma.user.update({
      where: {
        cpf: data.cpf,
      },
      data: {
        cpf: data.cpf,
        name: data.nome,
        lastLogin: new Date()
      }
    });
  }
  
  async validateRM(cpf: string, password: string): Promise<any> {
    const axiosInstance = this.createAxiosInstance(cpf, password);

    const dados = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
      <soapenv:Header/>
      <soapenv:Body>
          <tot:RealizarConsultaSQL>
            <tot:codSentenca></tot:codSentenca>
            <tot:codColigada></tot:codColigada>
            <tot:codSistema></tot:codSistema>
            <tot:parameters></tot:parameters>
          </tot:RealizarConsultaSQL>
      </soapenv:Body>
    </soapenv:Envelope>
    `;

    return await axiosInstance.post('/', dados)
    .then(async (response) => {
      try {
        if(response.status == 200) {
          const responseData =  await this.getUserDataFromTotvsRm(cpf);
          const jsonData = await this.parser.parseStringPromise(responseData['s:Envelope']['s:Body'][0].RealizarConsultaSQLResponse[0].RealizarConsultaSQLResult[0]);
          const userData = jsonData.NewDataSet;
          return {
            data: userData,
            statusCode: response.status
          }
        }
      } catch (err) {
        return {
          error: err.message,
          statusCode: HttpStatus.UNAUTHORIZED
        };
      }
    })
    .catch((error) => {
      if (error.response) {
        return {
          error: error.message,
          statusCode: error.response.status
        };
      } else {
        return {
          error: error.message,
          statusCode: 500
        };
      }
    });
  }

  async getUserDataFromTotvsRm(cpf: string): Promise<any> {

    const axiosInstance = this.createAxiosInstance(process.env.LOGIN_RM, process.env.SENHA_RM);

    const dados = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
        <soapenv:Header/>
        <soapenv:Body>
          <tot:RealizarConsultaSQL>
              <tot:codSentenca>FLUIG.SQL.0001</tot:codSentenca>
              <tot:codColigada>1</tot:codColigada>
              <tot:codSistema>S</tot:codSistema>
              <tot:parameters>CPF=${cpf}</tot:parameters>
          </tot:RealizarConsultaSQL>
        </soapenv:Body>
      </soapenv:Envelope>
    `;

    return await axiosInstance.post('/', dados)
    .then(async (response) => {
      try {
        const jsonData = await this.parser.parseStringPromise(response.data);
        return jsonData;
      } catch (err) {
        return {
          error: err.message,
          statusCode: response.status
        };
      }
    })
    .catch((error) => {
      if (error.response) {
        return {
          error: error.message,
          statusCode: error.response.status
        };
      } else {
        return {
          error: error.message,
          statusCode: 500
        };
      }
    });
  }

  createAxiosInstance(cpf: string, password: string) {
    const auth = 'Basic ' + Buffer.from(`${cpf}:${password}`).toString('base64');
    return axios.create({
      baseURL: 'http://totvsapp.univale.br:8051/wsConsultaSQL/IwsConsultaSQL',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'http://www.totvs.com/IwsConsultaSQL/RealizarConsultaSQL',
        Authorization: auth,
      },
      transformResponse: (data) => {
        delete data.req;
        delete data.res;
        return data;
      },
    });
  }
}
