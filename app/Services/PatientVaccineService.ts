import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import User from 'App/Models/User';
import IPatientVaccineData from 'Contracts/interfaces/IPatientVaccineData';

import PatientVaccine from '../Models/PatientVaccine';

@inject()
export default class PatientVaccineService {
  public async index(unitId: string) {
    const qb = PatientVaccine.query();

    qb.where('business_unit_id', unitId);

    return qb;
  }

  public async store(unitId: string, user: User, data: IPatientVaccineData) {
    return PatientVaccine.create({
      business_unit_id: unitId,
      user_id: data.userId ?? user.id,
      patient_id: data.patientId,
      vaccine_id: data.vaccineId,
      vaccine_protocol_id: data.vaccineProtocolId,
      schedule_id: data.scheduleId,
    });
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
      .preload('schedule');

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
