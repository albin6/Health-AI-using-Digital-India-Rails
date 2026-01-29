import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "../di/tokens";
import { IHealthRepository } from "../repositories/interfaces/IHealthRepository";
import { IHealthService } from "./interfaces/IHealthService";
import { IAppConfig } from "../config/IAppConfig";

@injectable()
export class HealthService implements IHealthService {
    constructor(
        @inject(DI_TOKENS.HealthRepository) private healthRepo: IHealthRepository,
        @inject(DI_TOKENS.Config) private config: IAppConfig
    ) { }

    public async checkHealth(): Promise<{ status: string; uptime: number; timestamp: string; env: string }> {
        const sysStatus = await this.healthRepo.getSystemStatus();

        return {
            status: sysStatus.database ? "OK" : "DEGRADED",
            uptime: sysStatus.uptime,
            timestamp: new Date().toISOString(),
            env: this.config.env, // Demonstrating usage
        };
    }
}
