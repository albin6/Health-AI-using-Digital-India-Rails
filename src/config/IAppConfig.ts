export interface IAppConfig {
    env: "development" | "production" | "test";
    server: {
        port: number;
    };
    db: {
        url?: string;
    };
    eka: {
        baseUrl: string;
        clientId: string;
        clientSecret: string;
    };
    whatsapp: {
        verifyToken: string;
        accessToken: string;
        phoneNumberId: string;
    };
    ml: {
        apiUrl: string;
    };
}
