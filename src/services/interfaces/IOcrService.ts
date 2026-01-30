export interface IOcrService {
    extractText(fileUrl: string): Promise<any>; // Returns structured JSON
}
