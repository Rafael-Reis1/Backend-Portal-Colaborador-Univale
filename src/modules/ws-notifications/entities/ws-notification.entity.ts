export class WsNotification {
    id?: string;
    title: string;
    text: string;
    cpfReceiver: string;
    cpfSender?: string;
    priority: string;
    instanceId: number;
    processId: string;
    read: boolean;
    createdAt: Date;
    token: string;
}
