export interface IAppConfig {
    env: "development" | "production" | "test";
    server: {
        port: number;
    };
    db: {
        url?: string;
    };
}
