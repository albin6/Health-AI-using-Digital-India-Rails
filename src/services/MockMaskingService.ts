import { injectable } from "tsyringe";
import { IMaskingService } from "./interfaces/IMaskingService";

@injectable()
export class MockMaskingService implements IMaskingService {
    async maskPii(fileUrl: string): Promise<string> {
        console.log(`🎭 [MaskingService] Masking PII for: ${fileUrl}`);
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `${fileUrl}_masked.pdf`;
    }
}
