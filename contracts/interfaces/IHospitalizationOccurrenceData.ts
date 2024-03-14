import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import { DateTime } from "luxon";

export default interface IHospitalizationOccurrenceData {
	hospitalizationId: string;
	occurrenceId: string;
	hospitalizationMedicalPrescriptionId?: string;
	executedAt: DateTime;
	previewedAt: DateTime;
	description: string;
	resume: string;
	active: boolean;
	attachments?: MultipartFileContract[];
}

export interface IHospitalizationOccurrenceAttachmentData {
	occurrenceId: string;
	attachments: MultipartFileContract[];
}
