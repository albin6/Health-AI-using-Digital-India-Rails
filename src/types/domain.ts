export enum ProcessingStatus {
    UPLOADED = "UPLOADED",
    MASKED = "MASKED",
    OCR_DONE = "OCR_DONE",
    FHIR_MAPPED = "FHIR_MAPPED",
    LINKED = "LINKED"
}

export interface IUser {
    uuid: string;
    phoneNumber: string;
    oid?: string; // Eka User ID / External Identifier
    abhaId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IMedicalRecord {
    id?: string;
    userUuid: string;
    fileUrl: string;
    maskedFileUrl?: string; // URL to the masked file
    ocrOutput?: unknown; // JSON structure from OCR
    fhirResource?: unknown; // FHIR R4 resource JSON
    status: ProcessingStatus;
    auditLog: Array<{
        status: ProcessingStatus;
        timestamp: Date;
        details?: string;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
}
