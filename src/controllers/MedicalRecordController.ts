import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "../di/tokens";
import { IMedicalRecordService } from "../services/interfaces/IMedicalRecordService";

@injectable()
export class MedicalRecordController {
    constructor(
        @inject(DI_TOKENS.MedicalRecordService) private medicalRecordService: IMedicalRecordService
    ) {}

    public processUpload = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userUuid, fileUrl } = req.body;
            if (!userUuid || !fileUrl) {
                res.status(400).json({ error: "Missing userUuid or fileUrl" });
                return;
            }

            const record = await this.medicalRecordService.processUpload(userUuid, fileUrl);
            res.status(200).json(record);
        } catch (error: any) {
            console.error("Upload processing error:", error);
            res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    };

    public getUserRecords = async (req: Request, res: Response): Promise<void> => {
        try {
            const userUuid = req.params.userUuid as string;
            const records = await this.medicalRecordService.getUserRecords(userUuid);
            res.status(200).json(records);
        } catch (error: any) {
             res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    };
}
