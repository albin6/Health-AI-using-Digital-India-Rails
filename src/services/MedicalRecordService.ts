import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "../di/tokens";
import { IMedicalRecordService } from "./interfaces/IMedicalRecordService";
import { IMedicalRecordRepository } from "../repositories/interfaces/IMedicalRecordRepository";
import { IMaskingService } from "./interfaces/IMaskingService";
import { IOcrService } from "./interfaces/IOcrService";
import { IFhirService } from "./interfaces/IFhirService";
import { IMedicalRecord, ProcessingStatus } from "../types/domain";

@injectable()
export class MedicalRecordService implements IMedicalRecordService {
    constructor(
        @inject(DI_TOKENS.MedicalRecordRepository) private repo: IMedicalRecordRepository,
        @inject(DI_TOKENS.MaskingService) private maskingService: IMaskingService,
        @inject(DI_TOKENS.OcrService) private ocrService: IOcrService,
        @inject(DI_TOKENS.FhirService) private fhirService: IFhirService
    ) {}

    async processUpload(userUuid: string, fileUrl: string): Promise<IMedicalRecord> {
        console.log(`🚀 [MedicalRecordService] Starting processing for User: ${userUuid}`);

        // 1. Create Initial Record
        let record = await this.repo.create({
            userUuid,
            fileUrl,
            status: ProcessingStatus.UPLOADED,
            auditLog: [{ status: ProcessingStatus.UPLOADED, timestamp: new Date(), details: "File received" }]
        });

        // Async processing (conceptually). For now we await sequentially.
        try {
            // 2. Masking
            console.log(`🔒 [MedicalRecordService] Masking file...`);
            const maskedUrl = await this.maskingService.maskPii(fileUrl);
            record = (await this.repo.update(record.id!, {
                maskedFileUrl: maskedUrl,
                status: ProcessingStatus.MASKED,
                $push: { auditLog: { status: ProcessingStatus.MASKED, timestamp: new Date() } }
            } as any))!;

            // 3. OCR
            console.log(`📖 [MedicalRecordService] Performing OCR...`);
            const ocrOutput = await this.ocrService.extractText(maskedUrl);
             record = (await this.repo.update(record.id!, {
                ocrOutput: ocrOutput,
                status: ProcessingStatus.OCR_DONE,
                $push: { auditLog: { status: ProcessingStatus.OCR_DONE, timestamp: new Date() } }
            } as any))!;

            // 4. FHIR Mapping
            console.log(`⚕️ [MedicalRecordService] Mapping to FHIR...`);
            const fhirData = await this.fhirService.mapToFhir(ocrOutput, userUuid);
             record = (await this.repo.update(record.id!, {
                fhirResource: fhirData,
                status: ProcessingStatus.FHIR_MAPPED,
                $push: { auditLog: { status: ProcessingStatus.FHIR_MAPPED, timestamp: new Date() } }
            } as any))!;
            
            console.log(`✅ [MedicalRecordService] Processing Complete for Record: ${record.id}`);
            return record;

        } catch (error: any) {
            console.error(`❌ [MedicalRecordService] Processing Failed:`, error);
            // In a real system, update status to FAILED
            throw error;
        }
    }

    async getUserRecords(userUuid: string): Promise<IMedicalRecord[]> {
        return this.repo.findByUser(userUuid);
    }
}
