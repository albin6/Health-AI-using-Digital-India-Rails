export interface IFhirService {
    mapToFhir(ocrData: any, patientId: string): Promise<any>; // Returns FHIR Bundle or Resource
}
