export class Notification {
    id?: string;
    cpfReceiver: string;
    nameSender: string
    instanceId: number;
    processId: string;
    acitivityName: string;
    url: string;
    read: boolean;
    createdAt: Date;
    token: string;
}
