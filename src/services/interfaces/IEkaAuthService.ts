export interface IEkaAuthService {
    getValidToken(): Promise<string>;
}
