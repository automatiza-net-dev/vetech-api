import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Schedule from 'App/Models/Schedule';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import {
  SS_ATTENDANCE_CANCELLED,
  SS_ATTENDANCE_FINISHED,
  SS_NOT_CONFIRMED,
  VALID_CHANGES,
} from 'App/Models/ScheduleStatus';
import WeekDay from 'App/Models/shared/WeekDay';
import UnavailableDay from 'App/Models/UnavailableDay';
import User from 'App/Models/User';
import WorkingDay from 'App/Models/WorkingDay';
import SharedService, { DateSet } from 'App/Services/SharedService';
import IScheduleData, {
  IRescheduleData,
} from 'Contracts/interfaces/IScheduleData';
import IUpdateScheduleStatus from 'Contracts/interfaces/IUpdateScheduleStatus';
import IViewDailyServicesRequest from 'Contracts/interfaces/IViewDailyServicesRequest';
import IViewDisponibilityRequest from 'Contracts/interfaces/IViewDisponibilityRequest';
import {
  addDays,
  addHours,
  endOfDay,
  format,
  intervalToDuration,
  isSameDay,
  startOfDay,
} from 'date-fns';
import { DateTime } from 'luxon';

interface ISearch {
  patient?: string;
  complaint?: string;
}

interface IHomeSearch {
  confirmed?: string;
  unit?: string;
  page?: number;
  per_page?: number;
}

@inject()
export default class ScheduleService {
  constructor(private readonly sharedService: SharedService) {}
  public async homeContent(unitId: string, data: IHomeSearch) {
    const qb = Schedule.query()
      .where('business_unit_id', data.unit ?? unitId)
      .preload('patient', query => {
        query.preload('patientAnimal', query => {
          query.preload('race', query => {
            query.preload('specie');
          });
        });
      })
      .preload('holder', query => {
        query.preload('tutor');
      })
      .preload('serviceType')
      .preload('serviceStatus')
      .preload('user')
      .orderBy('start_hour', 'asc');

    if (data.confirmed === 'false') {
      qb.where('schedule_status_id', SS_NOT_CONFIRMED);
    } else {
      qb.whereNotIn('schedule_status_id', [
        SS_NOT_CONFIRMED,
        SS_ATTENDANCE_FINISHED,
        SS_ATTENDANCE_CANCELLED,
      ]);
    }

    const result = await qb.paginate(data.page ?? 1, data.per_page ?? 10);

    return result;
  }

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
        query.select(['id', 'name', 'gender']);
      })
      .preload('holder', query => {
        query.select(['id', 'name']);
        query.preload('tutor', query => {
          query.select(['cellphone', 'telephone']);
        });
      })
      .preload('reschedules', query => {
        query.preload('reason');
        query.preload('user', query => query.select(['id', 'name', 'email']));
      })
      .preload('scheduleOrigin')
      .preload('scheduleReturn');

    if (data.patient) {
      qb.where('patient_name', 'ilike', `%${data.patient}%`);
    }

    if (data.complaint) {
      qb.where('major_complaint', 'ilike', `%${data.complaint}%`);
    }

    return qb;
  }

  public async usersWithSchedule(
    unitId: string,
    props: {
      onDuty?: number;
    },
  ) {
    const group = await this.sharedService.getUserGroup(unitId);
    // const unit = await BusinessUnit.findOrFail(unitId);

    const now = new Date();

    const qb = group
      .related('users')
      .query()
      .orWhereHas('roles', query => {
        query.where('unit_id', unitId);
      })
      .orWhereHas('workingDays', query => {
        query.where('weekday_index', now.getDay());
      })
      .orWhereHas('schedules', query => {
        query.whereBetween('start_hour', [startOfDay(now), endOfDay(now)]);
      });

    if (props.onDuty) {
      qb.orWhere('on_duty', true);
    }

    const users = await qb;

    const uniqueIds = new Set(users.map(user => user.id));
    return Array.from(uniqueIds)
      .map(id => users.find(user => user.id === id))
      .filter(Boolean);
  }

  public async returnableSchedules(unitId: string, patientId: string) {
    const qb = Schedule.query()
      .where('business_unit_id', unitId)
      .where('patient_id', patientId)
      .whereNull('scheduleOriginId')
      .whereNull('scheduleReturnId')
      .whereHas('serviceType', query => {
        query.where('allow_return', true);
      })
      .whereBetween('start_hour', [
        DateTime.now().minus({ days: 30 }).toJSDate(),
        DateTime.now().toJSDate(),
      ])
      .preload('serviceType', query => {
        query.select(['id', 'description']);
      });

    return qb;
  }

  public async store(
    unitId: string,
    user: User,
    data: IScheduleData & { scheduleOriginId?: string },
  ): Promise<Schedule> {
    const exception = new BadRequestException(
      'Usuário não tem esse horário disponível',
      400,
      'E_BAD_REQUEST',
    );

    if (!data.onDuty) {
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
    }

    const result = await Schedule.create({
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      holder_id: data.holderId,
      age: data.age,
      startHour: data.startHour,
      endHour: data.endHour,
      majorComplaint: data.majorComplaint,
      business_unit_id: unitId,
      user_id: data.userId ?? user.id,
      patient_id: data.patientId,
      race_id: data.raceId,
      schedule_service_type_id: data.scheduleServiceTypeId,
      schedule_status_id: SS_NOT_CONFIRMED,
      scheduleOriginId: data.scheduleOriginId,
      onDuty: data.onDuty,
    });

    if (data.scheduleOriginId) {
      const origin = await Schedule.findOrFail(data.scheduleOriginId);
      origin.scheduleReturnId = result.id;
      await origin.save();
    }

    return result;
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
        query.select(['id', 'name', 'gender']);
      })
      .preload('holder', query => {
        query.select(['id', 'name']);
        query.preload('tutor', query => {
          query.select(['cellphone', 'telephone']);
        });
      })
      .preload('reschedules', query => {
        query.preload('reason');
        query.preload('user', query => query.select(['id', 'name', 'email']));
      })
      .preload('scheduleOrigin')
      .preload('scheduleReturn')
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
    data: Omit<IScheduleData, 'startHour' | 'endHour'>,
  ): Promise<Schedule> {
    const schedule = await this.show(unitId, id);

    // if (
    //   !this.sharedService.checkDTEqt(schedule.startHour, data.startHour) ||
    //   !this.sharedService.checkDTEqt(schedule.endHour, data.endHour)
    // ) {
    //   await ScheduleService.checkDisponibility(
    //     data.userId ?? user.id,
    //     unitId,
    //     {
    //       start: data.startHour.toJSDate(),
    //       end: data.endHour.toJSDate(),
    //     },
    //     exception,
    //   );

    //   if (!data.ignoreOverlapping) {
    //     const overlapping = await Schedule.query()
    //       .where('user_id', data.userId ?? user.id)
    //       .andWhere('business_unit_id', unitId)
    //       .andWhereRaw('start_hour <= ? and end_hour >= ?', [
    //         data.startHour.toJSDate(),
    //         data.endHour.toJSDate(),
    //       ])
    //       .first();

    //     if (overlapping) {
    //       throw new BadRequestException(
    //         'Horário já está ocupado',
    //         400,
    //         'E_BAD_REQUEST',
    //       );
    //     }
    //   }
    // }

    return schedule
      .merge({
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        holder_id: data.holderId,
        age: data.age,
        majorComplaint: data.majorComplaint,
        business_unit_id: unitId,
        user_id: data?.userId ?? user.id,
        patient_id: data.patientId,
        race_id: data.raceId,
        schedule_service_type_id: data.scheduleServiceTypeId,
        onDuty: data.onDuty,
      })
      .save();
  }

  public async reschedule(
    unitId: string,
    user: User,
    id: string,
    data: IRescheduleData,
  ): Promise<Schedule> {
    const schedule = await this.show(unitId, id);

    await ScheduleService.checkDisponibility(
      data.userId ?? user.id,
      unitId,
      {
        start: data.startHour.toJSDate(),
        end: data.endHour.toJSDate(),
      },
      new BadRequestException('Usuário não tem esse horário disponível'),
    );

    await schedule.related('reschedules').create({
      user_id: data.userId ?? user.id,
      originalDate: schedule.startHour,
      reason_id: data.reasonId,
      observation: data.observation,
    });

    return schedule
      .merge({
        startHour: data.startHour,
        endHour: data.endHour,
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
      const tmpDate = addDays(startDate, k);

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

  public async searchServices(unitId: string, data: IViewDailyServicesRequest) {
    const group = await this.sharedService.getUserGroup(unitId);
    const startDate = new Date(data.start);
    const endDate = new Date(data.end);

    const { days } = intervalToDuration({
      start: startDate,
      end: endDate,
    });

    const keys = Array.from({ length: (days ?? 0) + 1 }, (_, k) => {
      const tmpDate = addDays(startDate, k);

      return format(tmpDate, 'yyyy-MM-dd');
    });

    const services = await ScheduleServiceType.query()
      // .has('schedules', '>', 0)
      .where('active', true)
      .where('economic_group_id', group.id)
      .preload('schedules', query => {
        query.whereBetween('start_hour', [startDate, endDate]);

        query.preload('patient');
        query.preload('race');
        query.preload('holder');
        query.preload('user');
      });

    return keys.map(key => ({
      [key]: services.map(service => ({
        [service.description]: service.schedules
          .filter(schedule => {
            const scheduleDate = schedule.startHour.toJSDate();

            const keyDate = DateTime.fromFormat(key, 'yyyy-MM-dd').toJSDate();

            return isSameDay(scheduleDate, keyDate);
          })
          .map(schedule => ({
            id: schedule.id,
            startHour: schedule.startHour,
            endHour: schedule.endHour,
            age: schedule.age,
            majorComplaint: schedule.majorComplaint,
            holder: {
              id: schedule.holder?.id,
              name: schedule.holder?.name,
            },
            patient: {
              id: schedule.patient.id,
              name: schedule.patient.name,
            },
            race: {
              id: schedule.race?.id,
              description: schedule.race?.description,
            },
            user: {
              id: schedule.user.id,
              name: schedule.user.name,
            },
          })),
      })),
    }));
  }

  private mapSchedulesToDays(
    keys: string[],
    wDays: WorkingDay[],
    uDays: UnavailableDay[],
    schedules: Schedule[],
  ) {
    return keys.map(k => {
      const filteredWorkingDays = wDays.filter(day =>
        ScheduleService.dayOfWeekMatches(new Date(k), [day.weekDay]),
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
      .where('active', true)
      .where('business_unit_id', unitId)
      .andWhere('user_id', user)
      .andWhereILike('frequency', `%${ScheduleService.GetWD(start)}%`)
      .andWhereRaw('(start_date < ? or start_date is null)', [start])
      .andWhereRaw('(end_date > ? or end_date is null)', [end]);

    const schedules = await Schedule.query()
      .where('business_unit_id', unitId)
      .andWhere('user_id', user)
      .andWhereBetween('start_hour', [start, end])
      .preload('user', query => {
        query.select(['id', 'name', 'email', 'phone', 'profilePicture']);
      })
      .preload('serviceType', query => {
        query.select(['id', 'description']);
      })
      .preload('serviceStatus', query => {
        query.select(['id', 'description', 'color']);
      })
      .preload('patient', query => {
        query.select(['id', 'name', 'photo', 'tag']);

        query.preload('patientAnimal', subquery => {
          subquery.select(['id', 'race_id']);
          subquery.preload('race', subsubquery => {
            subsubquery.select(['id', 'description', 'specie_id']);
            subsubquery.preload('specie', subsubsubquery => {
              subsubsubquery.select(['id', 'description']);
            });
          });
        });
      })
      .preload('holder', query => {
        query.select(['id', 'name']);
        query.preload('tutor', query => {
          query.select(['cellphone', 'telephone']);
        });
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
      .preload('holder')
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
      .where('active', true)
      .where('business_unit_id', unit)
      .andWhereRaw('(start_date < ? or start_date is null)', [start])
      .andWhereRaw('(end_date > ? or end_date is null)', [end])
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
      .preload('holder', query => {
        query.select(['id', 'name']);
        query.preload('tutor', query => {
          query.select(['cellphone', 'telephone']);
        });
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
      .where('active', true)
      .where('business_unit_id', unit)
      .andWhere('user_id', user)
      .andWhereRaw('(start_date < ? or start_date is null)', [start])
      .andWhereRaw('(end_date > ? or end_date is null)', [end])
      .andWhereILike('frequency', `%${ScheduleService.GetWD(start)}%`)
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
      .where('active', true)
      .where('business_unit_id', unitId)
      .whereRaw(
        '(start_date <= ? or start_date is null) or (end_date >= ? or end_date is null)',
        [data.start, data.end],
      );

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

  private static dayOfWeekMatches(_date: Date, wd: Array<WeekDay>): boolean {
    return wd.includes(ScheduleService.GetWD(_date));
  }

  public static GetWD(date: Date) {
    return Object.values(WeekDay)[date.getDay()];
  }

  public async updateScheduleStatusWithStaticValues(
    unitId: string,
    data: IUpdateScheduleStatus,
  ) {
    const schedule = await Schedule.query()
      .where('id', data.scheduleId)
      .where('business_unit_id', unitId)
      .first();

    if (!schedule) {
      throw new ResourceNotFoundException('Agendamento não encontrado');
    }

    if (schedule.schedule_status_id === data.scheduleId) {
      return schedule;
    }

    const validChanges = VALID_CHANGES[schedule.schedule_status_id];
    if (!validChanges || !validChanges.includes(data.statusId)) {
      throw new BadRequestException('Mudança inválida');
    }

    return schedule
      .merge({
        schedule_status_id: data.statusId,
        finishedAt:
          data.statusId === SS_ATTENDANCE_FINISHED ? DateTime.now() : undefined,
      })
      .save();
  }
}
