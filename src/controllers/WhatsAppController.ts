import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "../di/tokens";
import { IWhatsAppService } from "../services/interfaces/IWhatsAppService";

@injectable()
export class WhatsAppController {
    constructor(
        @inject(DI_TOKENS.WhatsAppService) private whatsappService: IWhatsAppService
    ) { }

    public verify = (req: Request, res: Response) => {
        const mode = req.query["hub.mode"] as string;
        const token = req.query["hub.verify_token"] as string;
        const challenge = req.query["hub.challenge"] as string;

        if (this.whatsappService.verifyWebhook(mode, token)) {
            console.log("WEBHOOK VERIFIED");
            res.status(200).send(challenge);
        } else {
            console.log("WEBHOOK VERIFICATION FAILED");
            res.status(403).end();
        }
    };

    public handleWebhook = async (req: Request, res: Response) => {
        console.log("📥 [WhatsAppController] Received Webhook Event");
        // console.log("Payload:", JSON.stringify(req.body, null, 2)); // Optional: Verbose logging

        try {
            await this.whatsappService.handleIncomingMessage(req.body);
            console.log("✅ [WhatsAppController] Webhook processed successfully");
            res.status(200).end();
        } catch (error) {
            console.error("❌ [WhatsAppController] Error processing webhook:", error);
            res.status(200).end(); // Always return 200 to WhatsApp to avoid retries on logic errors
        }
    };
}
