export interface IMaskingService {
    maskPii(fileUrl: string): Promise<string>; // Returns URL of masked file
}
