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

        const timestamp = new Date().toISOString();

        // 1. Patient Resource (Reference)
        // Try to find name from PHI entities
        let patientName = "Unknown";
        if (ocrData.phi_detected?.entities) {
            const nameEntity = ocrData.phi_detected.entities.find((e: any) => e.type === 'NAME');
            if (nameEntity) patientName = nameEntity.text;
        }

        const patientResource = {
            resourceType: "Patient",
            id: patientId, // Use mobile as ID for simplicity in this context
            name: [{ text: patientName }],
            telecom: [{ system: "phone", value: patientId }]
        };
        bundle.entry.push({ resource: patientResource });

        // 2. Encounter Resource
        const encounterId = `enc-${Date.now()}`;
        const encounterResource = {
            resourceType: "Encounter",
            id: encounterId,
            status: "finished",
            class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB", display: "ambulatory" },
            subject: { reference: `Patient/${patientId}` },
            period: { start: timestamp }
        };
        bundle.entry.push({ resource: encounterResource });

        const extracted = ocrData.extracted_data || {};

        // 3. Medications -> MedicationRequest
        if (extracted.medications && Array.isArray(extracted.medications)) {
            extracted.medications.forEach((med: any, index: number) => {
                bundle.entry.push({
                    resource: {
                        resourceType: "MedicationRequest",
                        id: `med-${index}-${Date.now()}`,
                        status: "active",
                        intent: "order",
                        subject: { reference: `Patient/${patientId}` },
                        encounter: { reference: `Encounter/${encounterId}` },
                        medicationCodeableConcept: {
                            text: med.name
                        },
                        dosageInstruction: [{
                            text: `${med.dosage || ''} ${med.frequency || ''} ${med.duration || ''}`.trim()
                        }]
                    }
                });
            });
        }

        // 4. Tests Ordered -> ServiceRequest
        if (extracted.tests_ordered && Array.isArray(extracted.tests_ordered)) {
            extracted.tests_ordered.forEach((testName: string, index: number) => {
                bundle.entry.push({
                    resource: {
                        resourceType: "ServiceRequest",
                        id: `test-${index}-${Date.now()}`,
                        status: "active",
                        intent: "order",
                        subject: { reference: `Patient/${patientId}` },
                        encounter: { reference: `Encounter/${encounterId}` },
                        code: {
                            text: testName
                        }
                    }
                });
            });
        }

        // 5. Diagnosis -> Condition
        if (extracted.diagnosis) {
            bundle.entry.push({
                resource: {
                    resourceType: "Condition",
                    id: `cond-${Date.now()}`,
                    clinicalStatus: {
                        coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }]
                    },
                    subject: { reference: `Patient/${patientId}` },
                    encounter: { reference: `Encounter/${encounterId}` },
                    code: {
                        text: extracted.diagnosis
                    }
                }
            });
        }

        return bundle;
    }
}
