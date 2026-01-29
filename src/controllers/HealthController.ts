import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "../di/tokens";
import { IHealthService } from "../services/interfaces/IHealthService";

@injectable()
export class HealthController {
    constructor(
        @inject(DI_TOKENS.HealthService) private healthService: IHealthService
    ) { }

    public getHealth = async (req: Request, res: Response) => {
        const result = await this.healthService.checkHealth();
        res.json(result);
    };
}
