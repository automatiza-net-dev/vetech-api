export default interface IScheduleServiceTypeData {
  description?: string;
  resume: string;
  active: boolean;
  reservedMinutes: number;
  scheduleServiceGroupId: string;
  productId?: string;
  allowReturn: boolean;
}
