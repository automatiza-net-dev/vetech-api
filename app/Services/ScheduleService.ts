import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
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
    const exception = new BadRequestException(
      'Usuário não tem esse horário disponível',
      400,
      'E_BAD_REQUEST',
    );

    const unavailableDays = await user
      .related('unavailableDays')
      .query()
      .where('business_unit_id', unitId)
      .andWhereRaw('start_hour <= ? or end_hour >= ?', [
        data.startHour.toJSDate(),
        data.endHour.toJSDate(),
      ]);

    if (unavailableDays.length !== 0) {
      throw exception;
    }

    const overlapping = await Schedule.query()
      .where('user_id', user.id)
      .andWhere('business_unit_id', unitId)
      .andWhereRaw('start_hour <= ? and end_hour >= ?', [
        data.startHour.toJSDate(),
        data.endHour.toJSDate(),
      ])
      .first();

    if (overlapping) {
      throw new BadRequestException(
        'Horário já está ocupado',
        400,
        'E_BAD_REQUEST',
      );
    }

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
