export default interface IScheduleServiceTypeData {
  description: string;
  active: boolean;
  reservedMinutes: number;
  scheduleServiceGroupId: string;
  productId?: string;
  allowReturn: boolean;
}
