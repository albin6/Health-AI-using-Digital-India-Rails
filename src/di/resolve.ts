import { container } from "tsyringe";
import { DI_TOKENS } from "./tokens";
import { IHealthService } from "../services/interfaces/IHealthService";

export const resolve = {
    HealthService: () => container.resolve<IHealthService>(DI_TOKENS.HealthService),
};

export const resolveController = <T>(token: any): T => {
    return container.resolve<T>(token);
};
