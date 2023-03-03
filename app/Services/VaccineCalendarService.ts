import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import TimelineType, { VACCINE_UUID } from 'App/Models/TimelineType';
import User from 'App/Models/User';
import VaccineCalendar from 'App/Models/VaccineCalendar';
import TimelineService from 'App/Services/TimelineService';
import { IVaccineCalendarData } from 'Contracts/interfaces/IVaccineCalendarData';
import { DateTime } from 'luxon';

type ISearch = {
  patient: string;
  vaccineProtocol: string;
  vaccine?: string;
  schedule?: string;
  scheduleDate?: string;
  applicationDate?: string;
};

@inject()
export default class VaccineCalendarService {
  constructor(private timeline: TimelineService) {}

  async index(data: ISearch) {
    const qb = VaccineCalendar.query();

    if (!data.vaccineProtocol || !data.patient) {
      throw new BadRequestException('Parâmetros inválidos');
    }

    qb.preload('patientVaccine', query => {
      query.preload('vaccine');
      query.preload('protocol');
    });

    qb.whereHas('patientVaccine', query => {
      query.where('patient_id', data.patient);
      query.where('vaccine_protocol_id', data.vaccineProtocol);

      if (data.vaccine) {
        query.where('vaccine_id', data.vaccine);
      }
    });

    if (data.schedule) {
      qb.where('schedule_id', data.schedule);
    }

    if (data.scheduleDate) {
      const date = DateTime.fromISO(data.scheduleDate);

      qb.whereBetween('scheduling_date', [
        date.startOf('day').toISODate(),
        date.endOf('day').toISODate(),
      ]);
    }

    if (data.applicationDate) {
      const date = DateTime.fromISO(data.applicationDate);

      qb.whereBetween('application_date', [
        date.startOf('day').toISODate(),
        date.endOf('day').toISODate(),
      ]);
    }

    return qb;
  }

  async update(id: string, user: User, data: IVaccineCalendarData) {
    return Database.transaction(async trx => {
      const calendar = await VaccineCalendar.query()
        .useTransaction(trx)
        .where('id', id)
        .preload('patientVaccine', query => {
          query.preload('vaccine');
          query.preload('protocol');
          query.preload('patient');
        })
        .first();

      if (!calendar) {
        throw new ResourceNotFoundException(
          'Calendário de vacinação não encontrado',
        );
      }

      await calendar
        .merge({
          schedulingDate: data.schedulingDate ?? calendar.schedulingDate,
          applicationDate: data.applicationDate,
          dose: data.dose,
          laboratory: data.laboratory,
          batch: data.batch,
          product_id: data.productId,
        })
        .useTransaction(trx)
        .save();

      const timelineInfo = await TimelineType.findOrFail(VACCINE_UUID, {
        client: trx,
      });

      await AnimalTimeline.create({
        timeline_id: VACCINE_UUID,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          tag: calendar.patientVaccine.patient_id,
          origin: 'vaccine_application',
          patient_vaccine: {
            id: calendar.patientVaccine.id,
          },
          technician: {
            id: user.id,
            name: user.name,
          },
          vaccine: {
            id: calendar.patientVaccine.vaccine.id,
            name: calendar.patientVaccine.vaccine.name,
            description: calendar.patientVaccine.vaccine.description,
          },
          protocol: {
            id: calendar.patientVaccine.protocol.id,
          },
          schedulingDate: calendar.schedulingDate,
          applicationDate: data.applicationDate,
          dose: data.dose,
          laboratory: data.laboratory,
          batch: data.batch,
        },
      });

      return calendar;
    });
  }

  async destroy(id: string) {
    const calendar = await VaccineCalendar.find(id);

    if (!calendar) {
      throw new ResourceNotFoundException(
        'Calendário de vacinação não encontrado',
      );
    }

    calendar.merge({
      applicationDate: null,
      laboratory: null,
      batch: null,
      product_id: null,
    });

    return calendar.save();
  }
}
