export class Notification {
    id?: string;
    title: string;
    text: string;
    cpfReceiver: string;
    cpfSender?: string;
    nameSender: string
    priority: string;
    instanceId: number;
    processId: string;
    acitivityName: string;
    url: string;
    read: boolean;
    createdAt: Date;
    token: string;
}
