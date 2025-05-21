export default interface IUpdateScheduleStatus {
	scheduleId: string;
	statusId: string;

	userEmail?: string;
	userPwd?: string;

	reasonId?: string;
	observation?: string;
	ignoreConflict?: boolean;
}
