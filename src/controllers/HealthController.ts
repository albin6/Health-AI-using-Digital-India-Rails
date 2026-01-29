import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { DI_TOKENS } from "../di/tokens";
import { IHealthService } from "../services/interfaces/IHealthService";
import { IEkaAuthService } from "../services/interfaces/IEkaAuthService";

@injectable()
export class HealthController {
    constructor(
        @inject(DI_TOKENS.HealthService) private healthService: IHealthService,
        @inject(DI_TOKENS.EkaAuthService) private ekaAuthService: IEkaAuthService
    ) { }

    public getHealth = async (req: Request, res: Response) => {
        const result = await this.healthService.checkHealth();
        res.json(result);
    };

    public verifyAuth = async (req: Request, res: Response) => {
        try {
            console.log("Verifying Auth");
            const token = await this.ekaAuthService.getValidToken();
            console.log("Token: ", token);
            res.json({ status: "Authenticated", token_preview: token.substring(0, 10) + "..." });
        } catch (error) {
            console.log("Auth Failed");
            res.status(500).json({ status: "Auth Failed", error: error instanceof Error ? error.message : "Unknown" });
        }
    };
}
