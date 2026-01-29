export interface IWhatsAppService {
    verifyWebhook(mode: string | undefined, token: string | undefined): boolean;
    handleIncomingMessage(body: any): Promise<void>;
    sendTextMessage(to: string, message: string): Promise<void>;
}
