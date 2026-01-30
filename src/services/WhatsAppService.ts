import { inject, injectable } from "tsyringe";
import axios, { AxiosInstance } from "axios";
import { DI_TOKENS } from "../di/tokens";
import { IAppConfig } from "../config/IAppConfig";
import { IWhatsAppService } from "./interfaces/IWhatsAppService";
import { IEkaAuthService } from "./interfaces/IEkaAuthService";
import { IWhatsAppFlowService } from "./interfaces/IWhatsAppFlowService";

@injectable()
export class WhatsAppService implements IWhatsAppService {
    private client: AxiosInstance;

    constructor(
        @inject(DI_TOKENS.Config) private config: IAppConfig,
        @inject(DI_TOKENS.EkaAuthService) private ekaAuthService: IEkaAuthService,
        @inject(DI_TOKENS.WhatsAppFlowService) private flowService: IWhatsAppFlowService
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
        console.log("🔄 [WhatsAppService] Handling incoming message payload");
        try {
            console.log("🔑 [WhatsAppService] Validating Eka Auth Token...");
            await this.ekaAuthService.getValidToken();
            console.log("✅ [WhatsAppService] Auth Token Valid");

            if (body.object === "whatsapp_business_account") {
                const entry = body.entry?.[0];
                const changes = entry?.changes?.[0];
                const value = changes?.value;
                const messages = value?.messages;

                if (messages && messages.length > 0) {
                    const message = messages[0];
                    const from = message.from;
                    const messageType = message.type;

                    console.log(`📨 [WhatsAppService] Processing message from ${from} of type ${messageType}`);

                    // Delegate to Flow Service
                    console.log("👉 [WhatsAppService] Delegating to WhatsAppFlowService");
                    await this.flowService.handleMessage(from, messageType, message);
                    console.log("✅ [WhatsAppService] Message processing completed by FlowService");
                } else {
                    console.log("⚠️ [WhatsAppService] No messages found in payload or status update received.");
                }
            }
        } catch (error) {
            console.error("❌ [WhatsAppService] Error processing webhook:", error);
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
