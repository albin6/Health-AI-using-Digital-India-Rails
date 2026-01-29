import { Router } from "express";
import { container } from "tsyringe";
import { HealthController } from "../controllers/HealthController";

export function registerHealthRoutes(): Router {
    const router = Router();

    // Resolve controller directly from container to ensure injection works
    const healthController = container.resolve(HealthController);

    // Bind the method to the controller instance to preserve 'this' context
    router.get("/status", healthController.getHealth.bind(healthController));

    return router;
}
