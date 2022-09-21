import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Attendance from 'App/Models/Attendance';
import AttendanceStatusService from 'App/Services/AttendanceStatusService';
import ScheduleService from 'App/Services/ScheduleService';
import IAttendanceData from 'Contracts/interfaces/IAttendanceData';

interface ISearchAttendance {
  complaint?: string;
}

@inject()
export default class AttendanceService {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly statusService: AttendanceStatusService,
  ) {}

  // TODO paginate
  public async index(unitId: string, data: ISearchAttendance) {
    const query = Attendance.query().where('business_unit_id', unitId);

    if (data.complaint) {
      query.where('complaint', 'ilike', `%${data.complaint}%`);
    }

    return query;
  }

  public async show(unitId: string, id: string) {
    const attendance = await Attendance.query()
      .where('business_unit_id', unitId)
      .andWhere('id', id)
      .first();

    if (!attendance) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return attendance;
  }

  public async store(unitId: string, data: IAttendanceData) {
    const schedule = await this.scheduleService.show(unitId, data.schedule);
    const status = await this.statusService.show(unitId, data.status);

    return schedule.related('attendances').create({
      startDate: data.startDate.toJSDate(),
      endDate: data.endDate.toJSDate(),
      complaint: data.complaint,
      business_unit_id: unitId,
      attendance_status_id: status.id,
      clinicalExamination: data.clinicalExamination,
    });
  }

  public async update(unitId: string, id: string, data: IAttendanceData) {
    const attendance = await this.show(unitId, id);

    const schedule = await this.scheduleService.show(unitId, data.schedule);
    const status = await this.statusService.show(unitId, data.status);

    return attendance
      .merge({
        startDate: data.startDate.toJSDate(),
        endDate: data.endDate.toJSDate(),
        complaint: data.complaint,
        clinicalExamination: data.clinicalExamination,
        attendance_status_id: status.id,
        schedule_id: schedule.id,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const attendance = await this.show(unitId, id);

    await attendance.softDelete();
  }
}
