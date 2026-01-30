export interface IWhatsAppFlowService {
    handleMessage(from: string, messageType: string, content: any): Promise<void>;
}
