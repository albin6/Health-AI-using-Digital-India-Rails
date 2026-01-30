import { inject, injectable } from "tsyringe";
import axios, { AxiosInstance } from "axios";
import { DI_TOKENS } from "../di/tokens";
import { IAppConfig } from "../config/IAppConfig";

export interface IMlService {
    processImage(userId: string, imageBase64: string): Promise<any>;
}

@injectable()
export class MlService implements IMlService {
    private client: AxiosInstance;

    constructor(
        @inject(DI_TOKENS.Config) private config: IAppConfig
    ) {
        this.client = axios.create({
            baseURL: this.config.ml.apiUrl,
            headers: { "Content-Type": "application/json" },
        });
    }

    public async processImage(userId: string, imageBase64: string): Promise<any> {
        console.log(`📡 [MlService] Sending image to ML API for user: ${userId}`);
        try {
            const response = await this.client.post("/process", {
                user_id: userId,
                image_base64: imageBase64,
                include_images: false
            });
            console.log("✅ [MlService] ML Processing Success");
            return response.data;
        } catch (error: any) {
            console.error("❌ [MlService] ML Processing Failed:", error.response?.data || error.message);
            throw new Error(error.response?.data?.error || "Failed to process image");
        }
    }
}
