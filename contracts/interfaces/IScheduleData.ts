import { DateTime } from "luxon";

export default interface IScheduleData {
	scheduleServiceTypeId: string;
	patientId?: string;
	holderId?: string;
	patientName?: string;
	patientPhone?: string;
	startHour: DateTime;
	endHour: DateTime;
	age?: number;
	raceId?: string;
	majorComplaint?: string;
	userId?: string;
	ignoreOverlapping?: boolean;
	onDuty?: boolean;

	scheduleOriginId?: string;
	ignoreBlocking?: boolean;

	executions?: {
		treatmentId: number;
		treatmentItemId: number;
		treatmentExecutionId: number;
	}[];
}

export interface IRescheduleData {
	startHour: DateTime;
	endHour: DateTime;
	userId?: string;
	reasonId?: string;
	observation?: string;
	ignoreOverlapping?: boolean;
	ignoreBlocking?: boolean;
}
