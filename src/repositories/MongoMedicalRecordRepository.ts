import { injectable } from "tsyringe";
import { IMedicalRecordRepository } from "./interfaces/IMedicalRecordRepository";
import { IMedicalRecord } from "../types/domain";
import { MedicalRecordModel, IMedicalRecordDocument } from "../models/MedicalRecord.model";

@injectable()
export class MongoMedicalRecordRepository implements IMedicalRecordRepository {
    private mapToDomain(doc: IMedicalRecordDocument): IMedicalRecord {
        const obj = doc.toObject();
        return {
            ...obj,
            id: (obj as any)._id.toString(),
        } as IMedicalRecord;
    }

    async create(recordData: Omit<IMedicalRecord, "id" | "createdAt" | "updatedAt">): Promise<IMedicalRecord> {
        const record = await MedicalRecordModel.create(recordData);
        return this.mapToDomain(record);
    }

    async update(recordId: string, updates: Partial<IMedicalRecord>): Promise<IMedicalRecord | null> {
        const record = await MedicalRecordModel.findByIdAndUpdate(
            recordId,
            { $set: updates },
            { new: true }
        );
        return record ? this.mapToDomain(record) : null;
    }

    async findByUser(userUuid: string): Promise<IMedicalRecord[]> {
        const records = await MedicalRecordModel.find({ userUuid });
        return records.map(r => this.mapToDomain(r));
    }

    async findById(recordId: string): Promise<IMedicalRecord | null> {
        const record = await MedicalRecordModel.findById(recordId);
        return record ? this.mapToDomain(record) : null;
    }
}
