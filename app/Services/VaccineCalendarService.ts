import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import VaccineCalendar from 'App/Models/VaccineCalendar';
import { IVaccineCalendarData } from 'Contracts/interfaces/IVaccineCalendarData';

@inject()
export default class VaccineCalendarService {
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
