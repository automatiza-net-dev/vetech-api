import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Schedule from 'App/Models/Schedule';
import User from 'App/Models/User';
import { DateSet } from 'App/Services/SharedService';
import IScheduleData from 'Contracts/interfaces/IScheduleData';

@inject()
export default class ScheduleService {
  public async index(unitId: string): Promise<Array<Schedule>> {
    return Schedule.query().where('business_unit_id', unitId);
  }

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

    await ScheduleService.checkAvailableDays(
      user,
      unitId,
      {
        start: data.startHour.toJSDate(),
        end: data.endHour.toJSDate(),
      },
      exception,
    );

    await ScheduleService.checkUnavailableDays(
      user,
      unitId,
      {
        start: data.startHour.toJSDate(),
        end: data.endHour.toJSDate(),
      },
      exception,
    );

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

  private static async checkUnavailableDays(
    user: User,
    unitId: string,
    data: DateSet,
    exception: BadRequestException,
  ) {
    const unavailableDays = await user
      .related('unavailableDays')
      .query()
      .where('business_unit_id', unitId)
      .andWhereRaw('start_hour <= ? or end_hour >= ?', [data.start, data.end]);

    if (unavailableDays.length !== 0) {
      throw exception;
    }
  }

  private static async checkAvailableDays(
    user: User,
    unitId: string,
    data: DateSet,
    exception: BadRequestException,
  ) {
    const workingDays = await user
      .related('workingDays')
      .query()
      .where('business_unit_id', unitId)
      .andWhere('start_hour', '<=', data.start)
      .andWhere('end_hour', '>=', data.end);

    if (workingDays.length === 0) {
      throw exception;
    }
  }
}
