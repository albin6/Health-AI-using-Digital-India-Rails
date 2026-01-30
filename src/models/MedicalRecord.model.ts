import mongoose, { Schema, Document } from "mongoose";
import { IMedicalRecord, ProcessingStatus } from "../types/domain";

export interface IMedicalRecordDocument extends IMedicalRecord, Document {}

const MedicalRecordSchema = new Schema({
    userUuid: { type: String, required: true, index: true },
    fileUrl: { type: String, required: true },
    maskedFileUrl: { type: String },  // need to check if required
    ocrOutput: { type: Schema.Types.Mixed }, // Store JSON directly
    fhirResource: { type: Schema.Types.Mixed },
    status: { 
        type: String, 
        enum: Object.values(ProcessingStatus),
        default: ProcessingStatus.UPLOADED 
    },
    auditLog: [{
        status: { type: String, enum: Object.values(ProcessingStatus) },
        timestamp: { type: Date, default: Date.now },
        details: { type: String }
    }]
}, { timestamps: true });

export const MedicalRecordModel = mongoose.model<IMedicalRecordDocument>("MedicalRecord", MedicalRecordSchema);
