import { IMedicalRecord } from "../../types/domain";

export interface IMedicalRecordService {
    processUpload(userUuid: string, fileUrl: string): Promise<IMedicalRecord>;
    getUserRecords(userUuid: string): Promise<IMedicalRecord[]>;
}
