import { ScheduleServiceGroupType } from 'App/Models/ScheduleServiceGroup';

export default interface IScheduleServiceGroupData {
  description: string;
  active: boolean;
  type: ScheduleServiceGroupType;
}
