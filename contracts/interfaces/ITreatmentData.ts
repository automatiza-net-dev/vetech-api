import { DateTime } from "luxon";

export interface ICreateTreatment {
	scheduleServiceId: string;
	patientId?: string;
	resume?: string;
	protocol: string;
	internalObservation?: string;
	realizedAt?: DateTime;
	createdAt?: DateTime;

	scheduleId?: string;
}
