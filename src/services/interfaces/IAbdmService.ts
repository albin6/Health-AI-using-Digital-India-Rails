export interface IAbdmService {
    initLogin(identifier: string): Promise<string>; // Returns txn_id
    verifyOtp(txnId: string, otp: string): Promise<{ txnId: string; profiles: any[] }>;
    linkPhr(txnId: string, phrAddress: string): Promise<any>; // Returns profile details
}
