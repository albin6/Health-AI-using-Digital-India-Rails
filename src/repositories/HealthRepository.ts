import { injectable } from "tsyringe";
import { IHealthRepository } from "./interfaces/IHealthRepository";

@injectable()
export class HealthRepository implements IHealthRepository {
    public async getSystemStatus(): Promise<{ database: boolean; uptime: number }> {
        // Mock DB call
        return {
            database: true,
            uptime: process.uptime(),
        };
    }
}
