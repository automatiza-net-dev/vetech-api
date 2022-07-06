import { inject } from '@adonisjs/fold';
import Schedule from 'App/Models/Schedule';
import User from 'App/Models/User';
import IScheduleData from 'Contracts/interfaces/IScheduleData';

@inject()
export default class ScheduleService {
  public async store(
    unitId: string,
    user: User,
    data: IScheduleData,
  ): Promise<Schedule> {
    return Schedule.create({
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      age: data.age,
      startHour: data.startHour,
      endHour: data.endHour,
      majorComplaint: data.majorComplaint,
      business_unit_id: unitId,
      user_id: user.id,
      patient_id: data.patientId,
      race_id: data.raceId,
      schedule_service_type_id: data.scheduleServiceTypeId,
      schedule_status_id: data.scheduleStatusId,
    });
  }
}
