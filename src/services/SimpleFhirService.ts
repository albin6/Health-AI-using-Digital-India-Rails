import { injectable } from "tsyringe";
import { IFhirService } from "./interfaces/IFhirService";

@injectable()
export class SimpleFhirService implements IFhirService {
    async mapToFhir(ocrData: any, patientId: string): Promise<any> {
        console.log(`⚕️ [FhirService] Mapping OCR data to FHIR for patient ${patientId}`);
        const bundle = {
            resourceType: "Bundle",
            type: "collection",
            entry: [] as any[]
        };

        // Add Patient (Reference)
        const patientRef = { reference: `Patient/${patientId}` };

        // Add Observations
        if (ocrData.observations && Array.isArray(ocrData.observations)) {
            ocrData.observations.forEach((obs: any, index: number) => {
                bundle.entry.push({
                    resource: {
                        resourceType: "Observation",
                        id: `obs-${index}-${Date.now()}`,
                        status: "final",
                        code: {
                            coding: [{
                                system: "http://loinc.org",
                                code: obs.code,
                                display: obs.display
                            }]
                        },
                        subject: patientRef,
                        valueQuantity: {
                            value: obs.value,
                            unit: obs.unit,
                            system: "http://unitsofmeasure.org"
                        }
                    }
                });
            });
        }

        // Add DiagnosticReport
        bundle.entry.push({
            resource: {
                resourceType: "DiagnosticReport",
                status: "final",
                code: { text: "General Health Checkup" },
                subject: patientRef,
                effectiveDateTime: ocrData.metadata.date,
                result: bundle.entry.map(e => ({ reference: `${e.resource.resourceType}/${e.resource.id}` }))
            }
        });

        return bundle;
    }
}
