export interface IWhatsAppService {
    verifyWebhook(mode: string | undefined, token: string | undefined): boolean;
    handleIncomingMessage(body: any): Promise<void>;
    sendTextMessage(to: string, message: string): Promise<void>;
    sendInteractiveMessage(to: string, bodyText: string, buttons: { id: string; title: string }[]): Promise<void>;
    downloadMedia(mediaId: string): Promise<Buffer>;
}
