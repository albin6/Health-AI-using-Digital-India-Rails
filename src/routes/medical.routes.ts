import { Router } from "express";
import { container } from "tsyringe";
import { MedicalRecordController } from "../controllers/MedicalRecordController";

export function registerMedicalRoutes(): Router {
    const router = Router();
    const controller = container.resolve(MedicalRecordController);

    router.post("/upload", controller.processUpload.bind(controller));
    router.get("/user/:userUuid", controller.getUserRecords.bind(controller));

    return router;
}
