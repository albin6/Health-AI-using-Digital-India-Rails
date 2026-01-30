import { IMedicalRecord } from "../../types/domain";

export interface IMedicalRecordRepository {
    create(record: Omit<IMedicalRecord, "id" | "createdAt" | "updatedAt">): Promise<IMedicalRecord>;
    update(recordId: string, updates: Partial<IMedicalRecord>): Promise<IMedicalRecord | null>;
    findByUser(userUuid: string): Promise<IMedicalRecord[]>;
    findById(recordId: string): Promise<IMedicalRecord | null>;
}
