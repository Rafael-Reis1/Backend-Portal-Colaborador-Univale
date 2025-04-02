import { HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/database/PrismaService';
import * as xml2js from 'xml2js';
import { CreateUserDto } from './dto/create-user.dto';
import * as https from 'https';

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

    const fluigUser = await this.fluigUser(data.cpf);

    if(!userExist) {
      return await this.prisma.user.create({data: {
        cpf: data.cpf,
        name: data.nome,
        fluigUser: fluigUser,
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
        fluigUser: fluigUser,
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

  async getGestor(cpf: string): Promise<any> {
    const axiosInstance = this.createAxiosInstance(process.env.LOGIN_RM, process.env.SENHA_RM);

    const dados = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
        <soapenv:Header/>
        <soapenv:Body>
          <tot:RealizarConsultaSQL>
              <tot:codSentenca>FLUIG.SQL.0002</tot:codSentenca>
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
        const sqlResponse = jsonData['s:Envelope']['s:Body'][0].RealizarConsultaSQLResponse[0].RealizarConsultaSQLResult;
        const sqlResponseJson = await this.parser.parseStringPromise(sqlResponse);

        if(sqlResponseJson.NewDataSet.Resultado[0].COD_SECAO.length > 0) {
          return true;
        }
        else {
          return false;
        }
      } 
      catch (err) {
        return false;
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

  async fluigUser(cpf: string) {
    let userName = process.env.LOGIN_FLUIG;
    let password = process.env.PASSWORD_FLUIG;
    let companyId = '1'

    const axiosInstanceFindUser = this.createAxiosInstanceFindfluigUser();
        
    const dados = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.foundation.ecm.technology.totvs.com/">
          <soapenv:Header/>
          <soapenv:Body>
              <ws:getColleague>
                <username>${userName}</username>
                <password>${password}</password>
                <companyId>${companyId}</companyId>
                <colleagueId>${cpf}</colleagueId>
              </ws:getColleague>
          </soapenv:Body>
        </soapenv:Envelope>
    `;

    return await axiosInstanceFindUser.post('/', dados)
    .then(async (response) => {
      try {
        const xmlData = response.data;
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        const activeValue = result['soap:Envelope']['soap:Body']['ns1:getColleagueResponse'].colab.item.active;

        if (activeValue === 'true') {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    })
    .catch((error) => {
      return false;
    });
  }

  createAxiosInstanceFindfluigUser() {
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
    });

    return axios.create({
      baseURL: 'https://fluig.univale.br:8443/webdesk/ECMColleagueService?wsdl',
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        'SOAPAction': 'getColleague',
      },
      httpsAgent,
      transformResponse: (data) => {
        delete data.req;
        delete data.res;
        return data;
      },
    });
  }  
}
