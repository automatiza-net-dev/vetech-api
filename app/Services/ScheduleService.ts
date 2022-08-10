import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Schedule from 'App/Models/Schedule';
import WeekDay from 'App/Models/shared/WeekDay';
import UnavailableDay from 'App/Models/UnavailableDay';
import User from 'App/Models/User';
import WorkingDay from 'App/Models/WorkingDay';
import SharedService, { DateSet } from 'App/Services/SharedService';
import IScheduleData from 'Contracts/interfaces/IScheduleData';
import IViewDisponibilityRequest from 'Contracts/interfaces/IViewDisponibilityRequest';
import {
  addDays,
  addHours,
  endOfDay,
  format,
  intervalToDuration,
  startOfDay,
} from 'date-fns';

interface ISearch {
  patient?: string;
  complaint?: string;
}

@inject()
export default class ScheduleService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch): Promise<Array<Schedule>> {
    const qb = Schedule.query()
      .where('business_unit_id', unitId)
      .preload('serviceType', query => {
        query.select(['id', 'description']);
      })
      .preload('serviceStatus', query => {
        query.select(['id', 'description', 'color']);
      })
      .preload('patient', query => {
        query.select(['id', 'name']);
      });

    if (data.patient) {
      qb.where('patient_name', 'ilike', `%${data.patient}%`);
    }

    if (data.complaint) {
      qb.where('major_complaint', 'ilike', `%${data.complaint}%`);
    }

    return qb;
  }

  public async usersWithSchedule(unitId: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    return group
      .related('users')
      .query()
      .has('workingDays')
      .orHas('unavailableDays')
      .orHas('schedules');
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

    await ScheduleService.checkDisponibility(
      data.userId ?? user.id,
      unitId,
      {
        start: data.startHour.toJSDate(),
        end: data.endHour.toJSDate(),
      },
      exception,
    );

    if (!data.ignoreOverlapping) {
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

  public async show(unitId: string, id: string): Promise<Schedule> {
    const schedule = await Schedule.query()
      .where('id', id)
      .andWhere('business_unit_id', unitId)
      .preload('serviceType', query => {
        query.select(['id', 'description']);
      })
      .preload('serviceStatus', query => {
        query.select(['id', 'description', 'color']);
      })
      .preload('patient', query => {
        query.select(['id', 'name']);
      })
      .first();

    if (!schedule) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        400,
        'E_NOT_FOUND',
      );
    }

    return schedule;
  }

  public async update(
    unitId: string,
    user: User,
    id: string,
    data: IScheduleData,
  ): Promise<Schedule> {
    const schedule = await this.show(unitId, id);

    const exception = new BadRequestException(
      'Usuário não tem esse horário disponível',
      400,
      'E_BAD_REQUEST',
    );

    if (
      !this.sharedService.checkDTEqt(schedule.startHour, data.startHour) ||
      !this.sharedService.checkDTEqt(schedule.endHour, data.endHour)
    ) {
      await ScheduleService.checkDisponibility(
        data.userId ?? user.id,
        unitId,
        {
          start: data.startHour.toJSDate(),
          end: data.endHour.toJSDate(),
        },
        exception,
      );

      if (!data.ignoreOverlapping) {
        const overlapping = await Schedule.query()
          .where('user_id', user.id)
          .andWhere('business_unit_id', unitId)
          .andWhereRaw('start_hour <= ? and end_hour >= ?', [
            format(data.startHour.toJSDate(), 'HH:mm'),
            format(data.endHour.toJSDate(), 'HH:mm'),
          ])
          .first();

        if (overlapping) {
          throw new BadRequestException(
            'Horário já está ocupado',
            400,
            'E_BAD_REQUEST',
          );
        }
      }
    }

    return schedule
      .merge({
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
      })
      .save();
  }

  public async destroy(unitId: string, id: string): Promise<void> {
    const schedule = await this.show(unitId, id);

    await schedule.softDelete();
  }

  public async searchDisponibility(data: IViewDisponibilityRequest) {
    const startDate = new Date(data.start);
    const endDate = new Date(data.end);

    const { days } = intervalToDuration({
      start: startDate,
      end: endDate,
    });

    const keys = Array.from({ length: (days ?? 0) + 1 }, (_, k) => {
      const tmpDate = addDays(startDate, k + 1);

      return format(tmpDate, 'yyyy-MM-dd');
    });

    const [wDays, uDays, schedules] = data.user
      ? await this.getUserGeneralSchedules(
          data.user,
          data.business,
          startDate,
          endDate,
        )
      : await this.getGeneralSchedules(
          data.business,
          startOfDay(startDate),
          endOfDay(endDate),
        );

    return this.mapSchedulesToDays(keys, wDays, uDays, schedules);
  }

  private mapSchedulesToDays(
    keys: string[],
    wDays: WorkingDay[],
    uDays: UnavailableDay[],
    schedules: Schedule[],
  ) {
    return keys.map(k => {
      const filteredWorkingDays = wDays.filter(day =>
        ScheduleService.dayOfWeekMatches(new Date(k), day.weekDay),
      );

      const filteredUnavailableDays = uDays.filter(day =>
        ScheduleService.dayOfWeekMatches(new Date(k), day.frequency),
      );

      const filteredSchedules = schedules.filter(
        day => k === format(day.startHour.toJSDate(), 'yyyy-MM-dd'),
      );

      const users = [
        filteredUnavailableDays.map(s => s.user),
        filteredWorkingDays.map(s => s.user),
        filteredSchedules.map(s => s.user),
      ].flat();
      const uniqueIds = Array.from(new Set(users.map(u => u.id)));
      const uniqueUsers = uniqueIds.map(id => users.find(u => u.id === id)!);

      const allEvents = [
        ...filteredWorkingDays,
        ...filteredUnavailableDays,
        ...filteredSchedules,
      ];

      return {
        date: k,
        users: uniqueUsers.map(u => ({
          id: u.id,
          name: u.name,
          events: allEvents
            .filter(e => e.user.id === u.id)
            .map(day => ({
              start: day.startHour.toString(),
              end: day.endHour.toString(),
              type: this.getEventLabel(day),
              event: day,
            })),
        })),
      };
    });
  }

  public async userDailySchedule(unitId: string, user: string, day: Date) {
    const correctDate = addHours(day, 3);
    const start = startOfDay(correctDate);
    const end = endOfDay(correctDate);

    const workingDays = await WorkingDay.query()
      .where('business_unit_id', unitId)
      .andWhere('user_id', user)
      .andWhere('day_of_week', ScheduleService.GetWD(start))
      .andWhereBetween('start_hour', [
        format(start, 'HH:mm'),
        format(end, 'HH:mm'),
      ]);

    const unavailableDays = await UnavailableDay.query()
      .where('business_unit_id', unitId)
      .andWhere('user_id', user)
      .andWhere('frequency', ScheduleService.GetWD(start))
      .andWhere('start_date', '<', start)
      .andWhere('end_date', '>', end);

    const schedules = await Schedule.query()
      .where('business_unit_id', unitId)
      .andWhere('user_id', user)
      .andWhereBetween('start_hour', [start, end])
      .preload('serviceType', query => {
        query.select(['id', 'description']);
      })
      .preload('serviceStatus', query => {
        query.select(['id', 'description', 'color']);
      })
      .preload('patient', query => {
        query.select(['id', 'name']);
      });

    const allEvents = [...workingDays, ...unavailableDays, ...schedules];

    return allEvents.map(day => ({
      start: day.startHour.toString(),
      end: day.endHour.toString(),
      type: this.getEventLabel(day),
      event: day,
    }));
  }

  public async userAppointments(unitId: string, uid: string, day: Date) {
    const group = await this.sharedService.getUserGroup(unitId);
    const user = await group
      .related('users')
      .query()
      .where('user_id', uid)
      .firstOrFail();

    return user
      .related('schedules')
      .query()
      .whereBetween('start_hour', [startOfDay(day), endOfDay(day)])
      .preload('patient')
      .preload('serviceType')
      .preload('serviceStatus')
      .preload('race');
  }

  private getEventLabel(data: WorkingDay | UnavailableDay | Schedule) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { table } = data.constructor;
    if (table === 'working_days') return 'working';
    if (table === 'unavailable_days') return 'unavailable';
    return 'schedule';
  }

  async getGeneralSchedules(
    unit: string,
    start: Date,
    end: Date,
  ): Promise<[WorkingDay[], UnavailableDay[], Schedule[]]> {
    const workingDays = await WorkingDay.query()
      .where('business_unit_id', unit)
      .andWhereBetween('start_hour', [
        format(start, 'HH:mm'),
        format(end, 'HH:mm'),
      ])
      .preload('user');

    const unavailableDays = await UnavailableDay.query()
      .where('business_unit_id', unit)
      .andWhere('start_date', '<', start)
      .andWhere('end_date', '>', end)
      .preload('user');

    const schedules = await Schedule.query()
      .where('business_unit_id', unit)
      .andWhereBetween('start_hour', [start, end])
      .preload('serviceType', query => {
        query.select(['id', 'description']);
      })
      .preload('serviceStatus', query => {
        query.select(['id', 'description', 'color']);
      })
      .preload('patient', query => {
        query.select(['id', 'name']);
      })
      .preload('user');

    return [workingDays, unavailableDays, schedules];
  }

  async getUserGeneralSchedules(
    user: string,
    unit: string,
    start: Date,
    end: Date,
  ): Promise<[WorkingDay[], UnavailableDay[], Schedule[]]> {
    const workingDays = await WorkingDay.query()
      .where('business_unit_id', unit)
      .andWhere('user_id', user)
      .andWhere('day_of_week', ScheduleService.GetWD(start))
      .preload('user');

    const unavailableDays = await UnavailableDay.query()
      .where('business_unit_id', unit)
      .andWhere('user_id', user)
      .andWhere('start_date', '<', start)
      .andWhere('end_date', '>', end)
      .andWhere('frequency', ScheduleService.GetWD(start))
      .preload('user');

    const schedules = await Schedule.query()
      .where('business_unit_id', unit)
      .andWhere('user_id', user)
      .andWhereBetween('start_hour', [start, end])
      .preload('serviceType', query => {
        query.select(['id', 'description']);
      })
      .preload('serviceStatus', query => {
        query.select(['id', 'description', 'color']);
      })
      .preload('patient', query => {
        query.select(['id', 'name']);
      })
      .preload('user');

    return [workingDays, unavailableDays, schedules];
  }

  private static async checkDisponibility(
    user: string,
    unitId: string,
    data: DateSet,
    exception: BadRequestException,
  ) {
    const scheduleUser = await User.findOrFail(user);

    const workingDays = await WorkingDay.query()
      .where('business_unit_id', unitId)
      .andWhere('day_of_week', ScheduleService.GetWD(data.start));

    const wFiltered = workingDays
      .filter(w => {
        return w.startHour <= format(data.start, 'HH:mm');
      })
      .filter(w => {
        return w.endHour >= format(data.end, 'HH:mm');
      });

    if (wFiltered.length === 0) {
      throw exception;
    }

    const unavailableDays = await scheduleUser
      .related('unavailableDays')
      .query()
      .where('business_unit_id', unitId)
      .whereRaw('start_date <= ? or end_date >= ?', [data.start, data.end]);

    const uFiltered = unavailableDays
      .filter(w => ScheduleService.dayOfWeekMatches(data.start, w.frequency))
      .filter(w => {
        return w.startHour <= format(data.start, 'HH:mm');
      })
      .filter(w => {
        return w.endHour >= format(data.end, 'HH:mm');
      });

    if (uFiltered.length !== 0) {
      throw exception;
    }
  }

  private static dayOfWeekMatches(date: Date, wd: WeekDay): boolean {
    return ScheduleService.GetWD(date) === wd;
  }

  public static GetWD(date: Date) {
    return Object.values(WeekDay)[date.getDay()];
  }
}
