import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import { DateTime } from "luxon";

export type IPatientEvaluation = {
	patientId: string;
	resume: string;
	protocol: string;
	realizedAt: DateTime;
	technicianId: string;
	scheduleServiceId: string;

	observation?: string;
	internalObservation?: string;
	photos?: MultipartFileContract[];
};
