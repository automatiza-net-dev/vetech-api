import WeekDay from 'App/Models/shared/WeekDay';

export default interface IWorkingDayData {
  userId: string;
  dayOfWeek: WeekDay;
  startHour: string;
  endHour: string;
}
