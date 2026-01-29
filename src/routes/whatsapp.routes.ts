import { Router } from "express";
import { container } from "tsyringe";
import { WhatsAppController } from "../controllers/WhatsAppController";

export function registerWhatsAppRoutes(): Router {
    const router = Router();
    const controller = container.resolve(WhatsAppController);

    // GET for verification
    router.get("/", controller.verify.bind(controller));

    // POST for incoming messages
    router.post("/", controller.handleWebhook.bind(controller));

    return router;
}
