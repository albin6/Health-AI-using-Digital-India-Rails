import { inject, injectable } from "tsyringe";
import axios, { AxiosInstance } from "axios";
import { Mutex } from "async-mutex";
import { DI_TOKENS } from "../di/tokens";
import { IAppConfig } from "../config/IAppConfig";
import { IEkaAuthService } from "./interfaces/IEkaAuthService";
import { ITokenStore } from "./interfaces/ITokenStore";

@injectable()
export class EkaAuthService implements IEkaAuthService {
    private client: AxiosInstance;
    private mutex = new Mutex();

    constructor(
        @inject(DI_TOKENS.Config) private config: IAppConfig,
        @inject(DI_TOKENS.TokenStore) private tokenStore: ITokenStore
    ) {
        this.client = axios.create({
            baseURL: this.config.eka.baseUrl,
            headers: { "Content-Type": "application/json" },
        });
    }

    public async getValidToken(): Promise<string> {
        const cachedToken = await this.tokenStore.getAccessToken();
        if (cachedToken) {
            return cachedToken;
        }

        return await this.mutex.runExclusive(async () => {
            const tokenAfterLock = await this.tokenStore.getAccessToken();
            if (tokenAfterLock) {
                return tokenAfterLock;
            }

            const refreshToken = await this.tokenStore.getRefreshToken();
            if (refreshToken) {
                try {
                    console.log("Attempting Token Refresh...");
                    return await this.performRefresh(refreshToken);
                } catch (error) {
                    console.error("Refresh failed, falling back to full login.", error);
                }
            }

            console.log("Performing Full Login...");
            return await this.performLogin();
        });
    }

    private async performLogin(): Promise<string> {
        try {
            const response = await this.client.post("/connect-auth/v1/account/login", {
                client_id: this.config.eka.clientId,
                client_secret: this.config.eka.clientSecret,
            });

            const { access_token, refresh_token, expires_in, refresh_expires_in } = response.data;
            await this.tokenStore.saveTokens(access_token, refresh_token, expires_in, refresh_expires_in);

            return access_token;
        } catch (error) {
            console.error("Login Failed:", error);
            throw new Error("Failed to authenticate with Eka Care");
        }
    }

    private async performRefresh(refreshToken: string): Promise<string> {
        const expiredAccessToken = await this.tokenStore.getAccessToken(true);

        if (!expiredAccessToken) {
            console.warn("No expired access token found for refresh flow. Fallback to login.");
            return this.performLogin();
        }

        try {
            const response = await this.client.post("/connect-auth/v1/account/refresh-token", {
                refresh_token: refreshToken,
                access_token: expiredAccessToken
            }, {
                headers: {
                    "Authorization": expiredAccessToken,
                    "Client-Id": this.config.eka.clientId
                }
            });

            const { access_token, refresh_token: new_refresh_token, expires_in, refresh_expires_in } = response.data;

            await this.tokenStore.saveTokens(
                access_token,
                new_refresh_token || refreshToken,
                expires_in,
                refresh_expires_in
            );

            return access_token;
        } catch (error) {
            console.error("Refresh Failed:", error);
            return this.performLogin();
        }
    }
}
