export interface IAbdmService {
    initLogin(identifier: string): Promise<string>;
    verifyOtp(txnId: string, otp: string): Promise<{ txnId: string; profiles: any[] }>;
    linkPhr(txnId: string, phrAddress: string): Promise<any>;
    getProfileByMobile(mobile: string): Promise<any[]>;
}
