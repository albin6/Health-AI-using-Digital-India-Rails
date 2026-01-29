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
            console.log("✅ WEBHOOK VERIFIED");
            res.status(200).send(challenge);
        } else {
            console.log("❌ WEBHOOK VERIFICATION FAILED");
            res.status(403).end();
        }
    };

    public handleWebhook = async (req: Request, res: Response) => {
        // Run async in background, return 200 immediately to WhatsApp
        this.whatsappService.handleIncomingMessage(req.body);
        res.status(200).end();
    };
}
