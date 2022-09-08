import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import VaccineCalendar from 'App/Models/VaccineCalendar';
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

  async update(id: string, data: IVaccineCalendarData) {
    const calendar = await VaccineCalendar.find(id);

    if (!calendar) {
      throw new ResourceNotFoundException(
        'Calendário de vacinação não encontrado',
      );
    }

    calendar.merge({
      applicationDate: data.applicationDate,
      dose: data.dose,
      laboratory: data.laboratory,
      batch: data.batch,
      product_id: data.productId,
    });

    return calendar.save();
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
