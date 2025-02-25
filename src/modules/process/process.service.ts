import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';
import * as Multer from 'multer';
import * as oauthSignature from 'oauth-signature';
import { PrismaService } from 'src/database/PrismaService';
import * as xml2js from 'xml2js';
import { User } from '../user/entities/user.entity';
import { processDTO } from './process.dto';

@Injectable()
export class ProcessService {
    private axiosInstance: any;
    private parser: xml2js.Parser;
    constructor(private readonly prisma: PrismaService) {
        this.parser = new xml2js.Parser();
    }
 
    async startProcess(data: processDTO, user: User) {
        let colleagueIds = '';
        let formDataSoap = '';
        let userName = process.env.LOGIN_FLUIG;
        let password = process.env.PASSWORD_FLUIG;
        let companyId = '1'
        let targetState = data.targetState;

        data.colleagueIds.forEach((colleagueId) => {
            colleagueIds += `<item>${colleagueId}</item>`
        });
        
        data.formIds.forEach((formId, index) => {
            const formData = data.formData[index];
            formDataSoap += `<item>
                                <item>${formId}</item>
                                <item>${formData}</item>
                            </item>`
        });

        const textArea = JSON.parse(data.textAreaData);

        if (textArea != null && textArea !== undefined) {
            for (const key in textArea) {
                if (textArea.hasOwnProperty(key)) {
                const value = textArea[key];
                formDataSoap += `<item>
                                    <item>${key}</item>  
                                    <item>${value}</item>
                                </item>`;
                }
            }
        }

        const axiosInstance = this.createAxiosInstanceStartProcess();

        const dados = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.workflow.ecm.technology.totvs.com/">
                <soapenv:Header/>
                <soapenv:Body>
                <ws:startProcess>
                    <username>${userName}</username>
                    <password>${password}</password>
                    <companyId>${companyId}</companyId>
                    <processId>${data.processId}</processId>
                    <choosedState>${targetState}</choosedState>
                    <colleagueIds>
                        ${colleagueIds}
                    </colleagueIds>
                    <comments></comments>
                    <userId>${userName}</userId>
                    <completeTask>${data.completeTask}</completeTask>
                    <attachments></attachments>
                    <cardData>
                            ${formDataSoap}
                    </cardData>
                    <appointment></appointment>
                    <managerMode>false</managerMode>
                </ws:startProcess>
            </soapenv:Body>
            </soapenv:Envelope>
        `;

        return await axiosInstance.post('/', dados)
        .then(async (response) => {
            try {
                const jsonData = await this.parser.parseStringPromise(response.data);
                const responseData = { data: jsonData, statusCode: response.status };

                // Acessa iProcess aqui
                const envelope = responseData.data["soap:Envelope"];
                const body = envelope["soap:Body"][0];
                try {
                    const iProcess = 
                    body?.["ns1:startProcessResponse"]?.[0]?.result?.[0]?.item?.[6]?.item?.[1] || 
                    body?.["ns1:startProcessResponse"]?.[0]?.result?.[0]?.item?.[5]?.item?.[1];
                    const documentId = body?.["ns1:startProcessResponse"]?.[0]?.result?.[0]?.item?.[0]?.item?.[1];
                    
                    await this.prisma.process.create({ 
                        data: {
                            processInstanceId: parseInt(iProcess),
                            processId: data.processId,
                            cpf: user.cpf,
                            tipoAtividade: data.tipoAtividade,
                            nomeGestor: data.nomeGestor,
                            cpfGestor: data.cpfGestor,
                            documentId: documentId
                        },
                    })

                    return iProcess;
                } catch{
                    const soapEnvelope = responseData.data['soap:Envelope'];
                    const soapBody = soapEnvelope['soap:Body'];
                    const startProcessResponse = soapBody[0]['ns1:startProcessResponse'];
                    const resultArray = startProcessResponse[0].result;
                    const itemArray = resultArray[0].item;
                    
                    return itemArray[0].item;
                }
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

    createAxiosInstanceStartProcess() {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });

        return axios.create({
          baseURL: 'https://fluig.univale.br:8443/webdesk/ECMWorkflowEngineService?wsdl',
          headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'startProcess',
          },
          httpsAgent,
          transformResponse: (data) => {
            delete data.req;
            delete data.res;
            return data;
          },
        });
    }

    createAxiosInstanceTakeProcess() {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });

        return axios.create({
          baseURL: 'https://fluig.univale.br:8443/webdesk/ECMWorkflowEngineService?wsdl',
          headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'takeProcessTask',
          },
          httpsAgent,
          transformResponse: (data) => {
            delete data.req;
            delete data.res;
            return data;
          },
        });
    }
        
    async findProcessUser(user: User, data: processDTO) {
        return await this.prisma.process.findMany({
            where: {
                cpf: user.cpf,
                tipoAtividade: data.tipoAtividade,
                processId: data.processId
            },
            select: {
                activity: true,
                processInstanceId: true
            }
        });
    
        /*// Cria todas as Promises sem esperar por elas
        const axiosPromises = processDatas.map(processData =>
            this.getProcessAxios(processData.processInstanceId)
        );
    
        // Aguarda todas as Promises serem resolvidas em paralelo
        const responses = await Promise.all(axiosPromises);
    
        return Promise.all(responses.map(async response => {
            if (response) {
                try {
                   await this.prisma.process.update({
                        where: {
                            cpf: user.cpf,
                            processInstanceId: parseInt(response.processInstanceId)
                        },
                        data: {
                            status: response.status
                        }
                    });
                    return response;
                } catch (error) {
                    console.error("Erro ao atualizar processo:", error);
                    return null;
                }
            } else {
                return null;
            }
        }));*/
    }    

    async findProcessUserById(user: User, data: processDTO) {
        const processDatas = await this.prisma.process.findMany({
            where: {
                cpf: user.cpf,
                tipoAtividade: data.tipoAtividade,
                processInstanceId: parseInt(data.processInstanceId.toString()),
                processId: data.processId
            }
        });

        const axiosResponse = [];

        for (const processData of processDatas) {
            axiosResponse.push(await this.getProcessAxiosNoExpand(processData.processInstanceId));
        }

        const response = await Promise.all(axiosResponse);
        return await response.map(response => {
            if (response) {
                return response;
            } else {
                //console.error('Error in individual process request:', response);
                return null;
            }
        });
    }

    async getProcessAxios(processInstanceId) {
        const httpMethod = 'GET';
        const baseUrl = `https://fluig.univale.br:8443/process-management/api/v2/requests/${processInstanceId}`;
        //Url com o expand
        //Para usar a requisição sem parametros basta tirar os parametros aqui e em parameters
        const url = `${baseUrl}?expand=formFields&expand=activities&expand=deadlineSpecification`;
        const nonce = Math.random().toString(36).substr(2, 10);
        const timestamp = Math.floor(Date.now() / 1000);
    
        const parameters = {
            oauth_consumer_key: process.env.CONSUMER_KEY,
            oauth_token: process.env.ACCESS_TOKEN,
            oauth_nonce: nonce,
            oauth_timestamp: timestamp,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0',
            //Precisa colocar o expand aqui tambem
            expand: ['formFields', 'activities', 'deadlineSpecification']
        };
    
        const consumerSecret = process.env.CONSUMER_SECRET;
        const tokenSecret = process.env.TOKEN_SECRET;
        const signature = oauthSignature.generate(httpMethod, baseUrl, parameters, consumerSecret, tokenSecret, { encodeSignature: false });
        
        const headers = {
            Authorization: `OAuth oauth_consumer_key="${encodeURIComponent(parameters.oauth_consumer_key)}", oauth_token="${encodeURIComponent(parameters.oauth_token)}", oauth_signature_method="${encodeURIComponent(parameters.oauth_signature_method)}", oauth_timestamp="${encodeURIComponent(parameters.oauth_timestamp)}", oauth_nonce="${encodeURIComponent(parameters.oauth_nonce)}", oauth_version="${encodeURIComponent(parameters.oauth_version)}", oauth_signature="${encodeURIComponent(signature)}"`
        };
    
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url,
            headers
        };
        
        return await axios.request(config)
        .then(resposta => { 
            return resposta.data;
        })
        .catch(erro => {
            //console.error(erro);
        });
    }   
    
    async getProcessAxiosNoExpand(processInstanceId) {
        const httpMethod = 'GET';
        const baseUrl = `https://fluig.univale.br:8443/process-management/api/v2/requests/${processInstanceId}`;
        //Url com o expand
        //Para usar a requisição sem parametros basta tirar os parametros aqui e em parameters
        const url = `${baseUrl}?expand=formFields`;
        const nonce = Math.random().toString(36).substr(2, 10);
        const timestamp = Math.floor(Date.now() / 1000);
    
        const parameters = {
            oauth_consumer_key: process.env.CONSUMER_KEY,
            oauth_token: process.env.ACCESS_TOKEN,
            oauth_nonce: nonce,
            oauth_timestamp: timestamp,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0',
            //Precisa colocar o expand aqui tambem
            expand: ['formFields']
        };
    
        const consumerSecret = process.env.CONSUMER_SECRET;
        const tokenSecret = process.env.TOKEN_SECRET;
        const signature = oauthSignature.generate(httpMethod, baseUrl, parameters, consumerSecret, tokenSecret, { encodeSignature: false });
        
        const headers = {
            Authorization: `OAuth oauth_consumer_key="${encodeURIComponent(parameters.oauth_consumer_key)}", oauth_token="${encodeURIComponent(parameters.oauth_token)}", oauth_signature_method="${encodeURIComponent(parameters.oauth_signature_method)}", oauth_timestamp="${encodeURIComponent(parameters.oauth_timestamp)}", oauth_nonce="${encodeURIComponent(parameters.oauth_nonce)}", oauth_version="${encodeURIComponent(parameters.oauth_version)}", oauth_signature="${encodeURIComponent(signature)}"`
        };
    
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url,
            headers
        };
        
        return await axios.request(config)
        .then(resposta => {
            return resposta.data;
        })
        .catch(erro => {
            //console.error(erro);
        });
    }

    async moveProcessAxios(data: processDTO) {
        let formDataRest = '';
        let userName = process.env.LOGIN_FLUIG;
        let password = process.env.PASSWORD_FLUIG;
        let companyId = '1'
        const targetState = data.targetState;
        const httpMethod = 'POST';
        const baseUrl = `https://fluig.univale.br:8443/process-management/api/v2/requests/${data.processInstanceId}/move`;
        //Url com o expand
        //Para usar a requisição sem parametros basta tirar os parametros aqui e em parameters
        const url = `${baseUrl}`;
        const nonce = Math.random().toString(36).substr(2, 10);
        const timestamp = Math.floor(Date.now() / 1000);
    
        const parameters = {
            oauth_consumer_key: process.env.CONSUMER_KEY,
            oauth_token: process.env.ACCESS_TOKEN,
            oauth_nonce: nonce,
            oauth_timestamp: timestamp,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0'
            //Precisa colocar o expand aqui tambem
        };
    
        const consumerSecret = process.env.CONSUMER_SECRET;
        const tokenSecret = process.env.TOKEN_SECRET;
        const signature = oauthSignature.generate(httpMethod, baseUrl, parameters, consumerSecret, tokenSecret, { encodeSignature: false });
        
        const headers = {
            Authorization: `OAuth oauth_consumer_key="${encodeURIComponent(parameters.oauth_consumer_key)}", oauth_token="${encodeURIComponent(parameters.oauth_token)}", oauth_signature_method="${encodeURIComponent(parameters.oauth_signature_method)}", oauth_timestamp="${encodeURIComponent(parameters.oauth_timestamp)}", oauth_nonce="${encodeURIComponent(parameters.oauth_nonce)}", oauth_version="${encodeURIComponent(parameters.oauth_version)}", oauth_signature="${encodeURIComponent(signature)}"`
        };
        
        data.formIds.forEach((formId, index) => {
            const formData = data.formData[index];
            let comma = '';
            if (index > 0) {
                comma = ",";
            }
            formDataRest += `${comma}"${formId}": "${formData}"`
        });

        formDataRest += "," + data.textAreaData.replace(/[{}]/g, '').trim();

        formDataRest = JSON.parse(`{${formDataRest}}`);

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url,
            headers,
            data: {
                "movementSequence": 0,
                "assignee": "",
                "targetState": targetState,
                "targetAssignee": data.colleagueIds[0],
                "subProcessTargetState": 0,
                "comment": data.comment,
                "asManager": false,
                "formFields": formDataRest
            }
        };

        const axiosInstance = this.createAxiosInstanceTakeProcess();
        
        const dados = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.workflow.ecm.technology.totvs.com/">
            <soapenv:Header/>
            <soapenv:Body>
                <ws:takeProcessTask>
                    <username>${userName}</username>
                    <password>${password}</password>
                    <companyId>${companyId}</companyId>
                    <userId>${userName}</userId>
                    <processInstanceId>${data.processInstanceId}</processInstanceId>
                    <threadSequence></threadSequence>
                </ws:takeProcessTask>
            </soapenv:Body>
            </soapenv:Envelope>
        `;

        await axiosInstance.post('/', dados)
        .then(async (response) => {
            try {
                const jsonData = await this.parser.parseStringPromise(response.data);
                const responseData = { data: jsonData, statusCode: response.status };
          
                // Acessa iProcess aqui
          
                return responseData;
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

        return await axios.request(config)
        .then(resposta => {
            this.updateCardData(data, resposta.data.cardId)
            return resposta.data;
        })
        .catch(erro => {
            throw new HttpException(erro.response.data, HttpStatus.BAD_REQUEST);
        });
    }

    async updateCardData(data: processDTO, cardId: number) {
        const processId = await this.prisma.process.findFirst({
            where: {
                processInstanceId: Number(cardId)
            }
        });
        let formDataRest = '';
        const httpMethod = 'PUT';
        let baseUrl;
        if(processId) {
            baseUrl = `https://fluig.univale.br:8443/ecm-forms/api/v2/cardindex/${data.forlderId}/cards/${processId.documentId}`;
        }
        else {
            baseUrl = `https://fluig.univale.br:8443/ecm-forms/api/v2/cardindex/${data.forlderId}/cards/${cardId}`;
        }
        //Url com o expand
        //Para usar a requisição sem parametros basta tirar os parametros aqui e em parameters
        const url = `${baseUrl}`;
        const nonce = Math.random().toString(36).substr(2, 10);
        const timestamp = Math.floor(Date.now() / 1000);
    
        const parameters = {
            oauth_consumer_key: process.env.CONSUMER_KEY,
            oauth_token: process.env.ACCESS_TOKEN,
            oauth_nonce: nonce,
            oauth_timestamp: timestamp,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0'
            //Precisa colocar o expand aqui tambem
        };
    
        const consumerSecret = process.env.CONSUMER_SECRET;
        const tokenSecret = process.env.TOKEN_SECRET;
        const signature = oauthSignature.generate(httpMethod, baseUrl, parameters, consumerSecret, tokenSecret, { encodeSignature: false });
        
        const headers = {
            Authorization: `OAuth oauth_consumer_key="${encodeURIComponent(parameters.oauth_consumer_key)}", oauth_token="${encodeURIComponent(parameters.oauth_token)}", oauth_signature_method="${encodeURIComponent(parameters.oauth_signature_method)}", oauth_timestamp="${encodeURIComponent(parameters.oauth_timestamp)}", oauth_nonce="${encodeURIComponent(parameters.oauth_nonce)}", oauth_version="${encodeURIComponent(parameters.oauth_version)}", oauth_signature="${encodeURIComponent(signature)}"`
        };
        formDataRest += `[`;
        data.formIds.forEach((formId, index) => {
            const formData = data.formData[index];
            let comma = '';
            if (index > 0) {
                comma = ",";
            }
            formDataRest += `${comma}{"fieldId":"${formId}", "value":"${formData}"}`;
        });

        const textArea = JSON.parse(data.textAreaData);
        const [key] = Object.keys(textArea);
        let value = textArea[key];
        const transformedText = value.split('\n').join('\\n');
    
        formDataRest += `,{"fieldId":"${key}", "value":"${transformedText}"}`
        formDataRest += `]`

        formDataRest = JSON.parse(`${formDataRest}`);

        const config = {
            method: 'put',
            maxBodyLength: Infinity,
            url,
            headers,
            data: {
                "values": formDataRest
            }
        };

        return await axios.request(config)
        .then(resposta => {
            return resposta.data;
        })
        .catch(erro => {
            //console.error(erro);
        });
    }

    async handleFiles(files: Multer.File[], user: User, parsedJson) {
        const rootForlder = await this.findFolder(217, user, user.cpf);
        const setorFolder = await this.findFolder(rootForlder, user, parsedJson.value2);
        const processFolder = await this.findFolder(setorFolder, user, parsedJson.value);
        const tipoAtividade = await this.findFolder(processFolder, user, parsedJson.key2);
        const instanceFolder = await this.findFolder(tipoAtividade, user, parsedJson.key.toString());
        return await this.sendFiles(files, instanceFolder);
    }

    async sendFiles(files, rootForlder) {
        // Parâmetros para OAuth
        const consumerKey = process.env.CONSUMER_KEY;
        const token = process.env.ACCESS_TOKEN;
        const consumerSecret = process.env.CONSUMER_SECRET;
        const tokenSecret = process.env.TOKEN_SECRET;
        let documentIds = '';
    
        // Usando for...of para fazer requisições assíncronas para cada arquivo
        for (const file of files) {
            // Criando o FormData para cada arquivo
            const formData = new FormData();
            const blob = new Blob([file.buffer], { type: file.mimetype });
            formData.append('file', blob, file.originalname); // Envia o arquivo com a chave 'file'
      
            const url = `https://fluig.univale.br:8443/content-management/api/v2/documents/upload/${encodeURIComponent(file.originalname)}/${rootForlder}/publish`;
      
            // Geração do nonce e timestamp para OAuth
            const nonce = Math.random().toString(36).substr(2, 10);
            const timestamp = Math.floor(Date.now() / 1000);
      
            // Parâmetros necessários para OAuth
            const parameters = {
                oauth_consumer_key: consumerKey,
                oauth_token: token,
                oauth_nonce: nonce,
                oauth_timestamp: timestamp,
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0',
            };
    
            // Gerar a assinatura OAuth
            const signature = oauthSignature.generate('POST', url, parameters, consumerSecret, tokenSecret, { encodeSignature: false });
    
            // Cabeçalhos de autenticação OAuth
            const headers = {
                'Content-Type': 'multipart/form-data',
                Authorization: `OAuth oauth_consumer_key="${encodeURIComponent(parameters.oauth_consumer_key)}", oauth_token="${encodeURIComponent(parameters.oauth_token)}", oauth_signature_method="${encodeURIComponent(parameters.oauth_signature_method)}", oauth_timestamp="${encodeURIComponent(parameters.oauth_timestamp)}", oauth_nonce="${encodeURIComponent(parameters.oauth_nonce)}", oauth_version="${encodeURIComponent(parameters.oauth_version)}", oauth_signature="${encodeURIComponent(signature)}"`
            };
    
            try {
                const response = await axios.post(url, formData, { headers });
                documentIds += `${response.data.documentId},`
            } catch (error) {
                //console.error(`Erro ao enviar o arquivo ${file.originalname}`, error);
            }
        }
    
        return documentIds;
    }

    async findFolder(parentId, user, folderName) {
        const rootForlder = await this.prisma.folders.findFirst({
            where: {
                folderName: folderName,
                cpf: user.cpf
            }
        });

        if(!rootForlder && parentId != 0) {
            const forlderId =  await this.createForlderApi(parentId, folderName);

            const folder =  await this.prisma.folders.create({
                data: {
                  folderName: folderName,
                  forlderId: forlderId,
                  cpf: user.cpf,
                },
            });

            return folder.forlderId;
        }
        else if(!rootForlder && parentId == 0) {
            return false;
        }

        return rootForlder.forlderId;
    }

    async createForlderApi(parentId, folderName) {
        // Parâmetros para OAuth
        const consumerKey = process.env.CONSUMER_KEY;
        const token = process.env.ACCESS_TOKEN;
        const consumerSecret = process.env.CONSUMER_SECRET;
        const tokenSecret = process.env.TOKEN_SECRET;

        const url = `https://fluig.univale.br:8443/content-management/api/v2/folders/${parentId}`;
    
        // Geração do nonce e timestamp para OAuth
        const nonce = Math.random().toString(36).substr(2, 10);
        const timestamp = Math.floor(Date.now() / 1000);
    
        // Parâmetros necessários para OAuth
        const parameters = {
            oauth_consumer_key: consumerKey,
            oauth_token: token,
            oauth_nonce: nonce,
            oauth_timestamp: timestamp,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0',
        };

        // Gerar a assinatura OAuth
        const signature = oauthSignature.generate('POST', url, parameters, consumerSecret, tokenSecret, { encodeSignature: false });

        // Cabeçalhos de autenticação OAuth
        const headers = {
            Authorization: `OAuth oauth_consumer_key="${encodeURIComponent(parameters.oauth_consumer_key)}", oauth_token="${encodeURIComponent(parameters.oauth_token)}", oauth_signature_method="${encodeURIComponent(parameters.oauth_signature_method)}", oauth_timestamp="${encodeURIComponent(parameters.oauth_timestamp)}", oauth_nonce="${encodeURIComponent(parameters.oauth_nonce)}", oauth_version="${encodeURIComponent(parameters.oauth_version)}", oauth_signature="${encodeURIComponent(signature)}"`
        };

        const body = {
            alias: `${folderName}`,
        };

        try {
            const response = await axios.post(url, body, { headers });
            return await response.data.documentId;
        } catch (error) {
            throw error;
        }
    }

    async getAttachments(user: User, processInstanceId: string) {
        const folderId = await this.findFolder(0, user, processInstanceId);
        if(folderId) {
            // Parâmetros para OAuth
            const consumerKey = process.env.CONSUMER_KEY;
            const token = process.env.ACCESS_TOKEN;
            const consumerSecret = process.env.CONSUMER_SECRET;
            const tokenSecret = process.env.TOKEN_SECRET;

            const baseUrl = `https://fluig.univale.br:8443/content-management/api/v2/folders/${folderId}/documents`;
            const queryParams = 'order=documentId';
            const url = `${baseUrl}?${queryParams}`;

            // Geração do nonce e timestamp para OAuth
            const nonce = Math.random().toString(36).substr(2, 10);
            const timestamp = Math.floor(Date.now() / 1000);

            // Parâmetros necessários para OAuth, incluindo os parâmetros da URL
            const parameters = {
                oauth_consumer_key: consumerKey,
                oauth_token: token,
                oauth_nonce: nonce,
                oauth_timestamp: timestamp,
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0',
                order: 'documentId',
            };

            // Gerar a assinatura OAuth
            const signature = oauthSignature.generate('GET', baseUrl, parameters, consumerSecret, tokenSecret, { encodeSignature: false });

            // Cabeçalhos de autenticação OAuth
            const headers = {
                Authorization: `OAuth oauth_consumer_key="${encodeURIComponent(parameters.oauth_consumer_key)}", oauth_token="${encodeURIComponent(parameters.oauth_token)}", oauth_signature_method="${encodeURIComponent(parameters.oauth_signature_method)}", oauth_timestamp="${encodeURIComponent(parameters.oauth_timestamp)}", oauth_nonce="${encodeURIComponent(parameters.oauth_nonce)}", oauth_version="${encodeURIComponent(parameters.oauth_version)}", oauth_signature="${encodeURIComponent(signature)}"`
            };

            try {
                const response = await axios.get(url, { headers });
                return response.data.invdata;
            } catch (error) {
                throw error;
            }

        }
    }

    async updateActivity(data: processDTO) {
        if(data.token == process.env.TOKEN_Fluig) {
            const activity = await this.prisma.process.findFirst({
                where: {
                    processInstanceId: data.processInstanceId
                }
            });
            
            if(activity) {
                const now = new Date();
                const lastUpdate = now.toISOString();
                await this.prisma.process.update({
                    where: {
                        processInstanceId: data.processInstanceId
                    },
                    data: {
                        activity: data.activity,
                        status: data.status,
                        lastUpdate: lastUpdate
                    }
                });
    
                return {
                    ok: 'ok'
                };
            }
    
            throw new HttpException('Activity not found!', HttpStatus.NOT_FOUND);
        }

        throw new HttpException('Token Error!', HttpStatus.UNAUTHORIZED);
    }
}
