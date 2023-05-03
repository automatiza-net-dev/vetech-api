export default interface IUpdateScheduleStatus {
  scheduleId: string;
  statusId: string;

  reasonId?: string;
  observation?: string;
}
