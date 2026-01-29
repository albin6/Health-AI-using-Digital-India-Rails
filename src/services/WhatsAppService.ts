import { inject, injectable } from "tsyringe";
import axios, { AxiosInstance } from "axios";
import { DI_TOKENS } from "../di/tokens";
import { IAppConfig } from "../config/IAppConfig";
import { IWhatsAppService } from "./interfaces/IWhatsAppService";
import { IEkaAuthService } from "./interfaces/IEkaAuthService";

@injectable()
export class WhatsAppService implements IWhatsAppService {
    private client: AxiosInstance;

    constructor(
        @inject(DI_TOKENS.Config) private config: IAppConfig,
        @inject(DI_TOKENS.EkaAuthService) private ekaAuthService: IEkaAuthService
    ) {
        this.client = axios.create({
            baseURL: "https://graph.facebook.com/v18.0",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.config.whatsapp.accessToken}`,
            },
        });
    }

    public verifyWebhook(mode: string | undefined, token: string | undefined): boolean {
        return mode === "subscribe" && token === this.config.whatsapp.verifyToken;
    }

    public async handleIncomingMessage(body: any): Promise<void> {
        try {
            await this.ekaAuthService.getValidToken();

            if (body.object === "whatsapp_business_account") {
                const entry = body.entry?.[0];
                const changes = entry?.changes?.[0];
                const value = changes?.value;
                const messages = value?.messages;

                if (messages && messages.length > 0) {
                    const message = messages[0];
                    const from = message.from;
                    const messageType = message.type;

                    console.log(`From: ${from}`);
                    console.log(`Type: ${messageType}`);

                    if (messageType === "text") {
                        const text = message.text.body;
                        console.log(`Message: ${text}`);
                        await this.sendTextMessage(from, `You said: "${text}"\n\nSend me a photo of your health document!`);
                    } else if (messageType === "image") {
                        const imageId = message.image.id;
                        const caption = message.image.caption || "(no caption)";
                        console.log(`Image ID: ${imageId}`);
                        console.log(`Caption: ${caption}`);

                        await this.sendTextMessage(from, "Document received! I will process this for your health record.");
                    } else {
                        console.log(`Unsupported message type: ${messageType}`);
                    }
                }
            }
        } catch (error) {
            console.error("Error processing webhook:", error);
        }
    }

    public async sendTextMessage(to: string, message: string): Promise<void> {
        try {
            const url = `/${this.config.whatsapp.phoneNumberId}/messages`;
            await this.client.post(url, {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: message },
            });
            console.log(`Message sent to ${to}`);
        } catch (error: any) {
            console.error("Failed to send message:", error.response?.data || error.message);
        }
    }
}
