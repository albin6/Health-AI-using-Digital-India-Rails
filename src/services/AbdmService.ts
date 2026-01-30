import { inject, injectable } from "tsyringe";
import axios, { AxiosInstance } from "axios";
import { DI_TOKENS } from "../di/tokens";
import { IAppConfig } from "../config/IAppConfig";
import { IEkaAuthService } from "./interfaces/IEkaAuthService";
import { IAbdmService } from "./interfaces/IAbdmService";

@injectable()
export class AbdmService implements IAbdmService {
    private client: AxiosInstance;

    constructor(
        @inject(DI_TOKENS.Config) private config: IAppConfig,
        @inject(DI_TOKENS.EkaAuthService) private ekaAuthService: IEkaAuthService
    ) {
        this.client = axios.create({
            baseURL: this.config.eka.baseUrl,
            headers: { "Content-Type": "application/json" },
        });

        // Add interceptor to inject Eka Token
        this.client.interceptors.request.use(async (req) => {
            const token = await this.ekaAuthService.getValidToken();
            req.headers["Authorization"] = `Bearer ${token}`;
            return req;
        });
    }

    public async initLogin(identifier: string): Promise<string> {
        console.log(`📡 [AbdmService] Requesting Init Login for: ${identifier}`);

        // Determine method based on length (14 digits -> abha-number, 10 digits -> mobile)
        const isAbhaNumber = /^\d{14}$/.test(identifier);
        const method = isAbhaNumber ? "abha-number" : "mobile";
        console.log(`ℹ️ [AbdmService] Detected method: ${method}`);

        try {
            const response = await this.client.post("/abdm/na/v1/profile/login/init", {
                identifier: identifier,
                method: method
            });
            console.log("✅ [AbdmService] Init Login Success. TxnID:", response.data?.txn_id);
            return response.data.txn_id;
        } catch (error: any) {
            console.error("❌ [AbdmService] Init Login Failed:", error.response?.data || error.message);
            throw new Error(error.response?.data?.error || "Failed to initiate login");
        }
    }

    public async verifyOtp(txnId: string, otp: string): Promise<{ txnId: string; profiles: any[] }> {
        console.log(`📡 [AbdmService] Verifying OTP for TxnID: ${txnId}`);
        try {
            const response = await this.client.post("/abdm/na/v1/profile/login/verify", {
                otp: otp,
                txn_id: txnId
            });
            console.log("✅ [AbdmService] Verify OTP Success");
            return {
                txnId: response.data.txn_id,
                profiles: response.data.abha_profiles || []
            };
        } catch (error: any) {
            console.error("❌ [AbdmService] Verify OTP Failed:", error.response?.data || error.message);
            throw new Error(error.response?.data?.error || "Failed to verify OTP");
        }
    }

    public async linkPhr(txnId: string, phrAddress: string): Promise<any> {
        console.log(`📡 [AbdmService] Requesting Link PHR for: ${phrAddress}`);
        try {
            const response = await this.client.post("/abdm/na/v1/profile/login/phr", {
                phr_address: phrAddress,
                txn_id: txnId
            });
            console.log("✅ [AbdmService] Link PHR Success");
            return response.data.profile;
        } catch (error: any) {
            console.error("❌ [AbdmService] Link PHR Failed:", error.response?.data || error.message);
            throw new Error(error.response?.data?.error || "Failed to link PHR");
        }
    }

    public async getProfileByMobile(mobile: string): Promise<any[]> {
        // Ensure mobile has +91 prefix for this specific Eka API if needed, 
        // but typically user enters 10 digits. The prompt example showed %2B91 prefix in query.
        // Let's assume input is 10 digits and we add prefix.
        const formattedMobile = mobile.startsWith("+91") ? mobile : `+91${mobile}`;
        console.log(`📡 [AbdmService] Fetching profile by mobile: ${formattedMobile}`);

        try {
            // NOTE: Using Eka Profile API, not ABDM Auth API
            const response = await this.client.get("/profiles/v1/patient/by-mobile/", {
                params: {
                    mob: formattedMobile,
                    full_profile: false
                }
            });
            console.log(`✅ [AbdmService] Fetched ${response.data?.length || 0} profiles`);
            return response.data || [];
        } catch (error: any) {
            console.error("❌ [AbdmService] Get Profile By Mobile Failed:", error.response?.data || error.message);
            throw new Error(error.response?.data?.error || "Failed to fetch profile details");
        }
    }
}
