export interface IHealthRepository {
    getSystemStatus(): Promise<{ database: boolean; uptime: number }>;
}
