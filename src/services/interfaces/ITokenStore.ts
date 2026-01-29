export interface ITokenStore {
    getAccessToken(includeExpired?: boolean): Promise<string | null>;
    getRefreshToken(): Promise<string | null>;
    saveTokens(accessToken: string, refreshToken: string, expiresIn: number, refreshExpiresIn: number): Promise<void>;
    clearTokens(): Promise<void>;
}
