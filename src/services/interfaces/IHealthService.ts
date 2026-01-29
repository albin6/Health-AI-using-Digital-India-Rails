export interface IHealthService {
    checkHealth(): Promise<{ status: string; uptime: number; timestamp: string; env: string }>;
}
