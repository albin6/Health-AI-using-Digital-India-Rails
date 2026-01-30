import { injectable } from "tsyringe";
import { IOcrService } from "./interfaces/IOcrService";

@injectable()
export class MockOcrService implements IOcrService {
    async extractText(fileUrl: string): Promise<any> {
        console.log(`👁️ [OcrService] Extracting text from: ${fileUrl}`);
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Return dummy structured data
        return {
            metadata: {
                reportType: "DiagnosticReport",
                date: new Date().toISOString()
            },
            patient: {
                name: "John Doe",
                age: 30
            },
            observations: [
                {
                    code: "8867-4",
                    display: "Heart rate",
                    value: 72,
                    unit: "/min"
                },
                {
                    code: "8480-6",
                    display: "Systolic blood pressure",
                    value: 120,
                    unit: "mm[Hg]"
                }
            ]
        };
    }
}
