import { injectable } from "tsyringe";
import { ITokenStore } from "./interfaces/ITokenStore";

@injectable()
export class InMemoryTokenStore implements ITokenStore {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private accessTokenExpiry: number = 0;
    private refreshTokenExpiry: number = 0;

    public async getAccessToken(): Promise<string | null> {
        if (!this.accessToken) return null;
        if (Date.now() >= this.accessTokenExpiry) return null;
        return this.accessToken;
    }

    public async getRefreshToken(): Promise<string | null> {
        if (!this.refreshToken) return null;
        if (Date.now() >= this.refreshTokenExpiry) return null;
        return this.refreshToken;
    }

    public async saveTokens(accessToken: string, refreshToken: string, expiresIn: number, refreshExpiresIn: number): Promise<void> {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        // expiresIn is usually in seconds
        this.accessTokenExpiry = Date.now() + expiresIn * 1000;
        this.refreshTokenExpiry = Date.now() + refreshExpiresIn * 1000;
    }

    public async clearTokens(): Promise<void> {
        this.accessToken = null;
        this.refreshToken = null;
        this.accessTokenExpiry = 0;
        this.refreshTokenExpiry = 0;
    }
}
