import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import User from 'App/Models/User';
import VaccineCalendar from 'App/Models/VaccineCalendar';
import VaccineProtocol from 'App/Models/VaccineProtocol';
import IPatientVaccineData from 'Contracts/interfaces/IPatientVaccineData';
import { DateTime } from 'luxon';

import PatientVaccine from '../Models/PatientVaccine';

@inject()
export default class PatientVaccineService {
  public async index(unitId: string) {
    const qb = PatientVaccine.query();

    qb.where('business_unit_id', unitId);

    return qb;
  }

  public async store(unitId: string, user: User, data: IPatientVaccineData) {
    const trx = await Database.transaction();

    const protocol = await VaccineProtocol.findOrFail(data.vaccineProtocolId);

    try {
      const entity = await PatientVaccine.create(
        {
          business_unit_id: unitId,
          user_id: data.userId ?? user.id,
          patient_id: data.patientId,
          vaccine_id: data.vaccineId,
          vaccine_protocol_id: data.vaccineProtocolId,
          schedule_id: data.scheduleId,
        },
        {
          client: trx,
        },
      );

      const calendars: Array<Partial<VaccineCalendar>> = Array.from(
        { length: protocol.doses },
        (_, index) => ({
          schedulingDate: DateTime.now().plus({
            days: index * protocol.interval,
          }),
          dose: index + 1,
          schedule_id: data.scheduleId,
          user_id: data.userId ?? user.id,
        }),
      );

      await entity.related('calendars').createMany(calendars, trx);

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      Logger.error(error.message);

      throw new InternalErrorException(
        'Erro na execução',
        500,
        'E_INTERNAL_ERROR',
      );
    }
  }

  public async show(unitId: string, id: string) {
    const qb = PatientVaccine.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .preload('vaccine', query => {
        query.preload('subgroup');
      })
      .preload('protocol')
      .preload('patient')
      .preload('user', query => {
        query.select('id', 'name', 'email');
      })
      .preload('schedule')
      .preload('calendars');

    const entity = await qb.first();

    if (!entity) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    return entity;
  }

  public async update(
    unitId: string,
    id: string,
    user: User,
    data: IPatientVaccineData,
  ) {
    const entity = await this.show(unitId, id);

    entity.merge({
      business_unit_id: unitId,
      user_id: data.userId ?? user.id,
      patient_id: data.patientId,
      vaccine_id: data.vaccineId,
      vaccine_protocol_id: data.vaccineProtocolId,
      schedule_id: data.scheduleId,
    });

    await entity.save();

    return entity;
  }

  public async destroy(unitId: string, id: string) {
    const entity = await this.show(unitId, id);

    await entity.softDelete();
  }
}
