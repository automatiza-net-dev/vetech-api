import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Bed from 'App/Models/Bed';
import Hospitalization from 'App/Models/Hospitalization';
import HospitalizationTimeline from 'App/Models/mongoose/HospitalizationTimeline';
import Occurrence, { OccurrenceType } from 'App/Models/Occurrence';
import Patient from 'App/Models/Patient';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import { IHospitalizationData } from 'Contracts/interfaces/IHospitalizationData';
import { DateTime } from 'luxon';

interface ISearch {
  tutor?: string;
  patient?: string;
  bed?: string;
}

@inject()
export default class HospitalizationService {
  constructor(private readonly sharedService: SharedService) {}

  public async timeline(unitId: string, id: string) {
    const hospitalization = await this.show(unitId, id);

    return HospitalizationTimeline.find({
      hospitalization_id: hospitalization.id,
    });
  }

  public async index(unitId: string, data: ISearch) {
    const qb = Hospitalization.query()
      .preload('bed')
      .preload('patient')
      .preload('tutor')
      .preload('technician')
      .preload('medicalPrescriptions', query => {
        query.preload('prescriptionUnit');
        query.preload('fluidUnit');
        query.preload('drugAdministration');
      })
      .preload('occurrences', query => {
        query.preload('occurrence');
        query.preload('user');
        query.preload('prescription');
        query.preload('attachments');
      })
      .preload('scheduling')
      .preload('parameters', query => {
        query.preload('parameter');
        query.preload('user');
      });

    qb.where('business_unit_id', unitId);

    if (data.tutor) {
      qb.where('tutor_id', data.tutor);
    }

    if (data.patient) {
      qb.where('patient_id', data.patient);
    }

    if (data.bed) {
      qb.where('bed_id', data.bed);
    }

    return qb;
  }

  public async show(unitId: string, id: string) {
    const qb = Hospitalization.query()
      .preload('bed')
      .preload('patient')
      .preload('tutor')
      .preload('technician')
      .preload('medicalPrescriptions', query => {
        query.preload('prescriptionUnit');
        query.preload('fluidUnit');
        query.preload('drugAdministration');
      })
      .preload('occurrences', query => {
        query.preload('occurrence');
        query.preload('user');
        query.preload('prescription');
        query.preload('attachments');
      })
      .preload('scheduling')
      .preload('parameters', query => {
        query.preload('parameter');
        query.preload('user');
      });

    qb.where('business_unit_id', unitId).where('id', id);

    const hospitalization = await qb.first();

    if (!hospitalization) {
      throw this.sharedService.ResourceNotFound();
    }

    return hospitalization;
  }

  public async store(unitId: string, user: User, data: IHospitalizationData) {
    const group = await this.sharedService.getUserGroup(unitId);
    const patient = await Patient.find(data.patientId);

    const occurrence = await Occurrence.query()
      .where('type', OccurrenceType.ADMISSAO_INTERNACAO)
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        group.id,
      ])
      .first();

    const ent = await Hospitalization.create({
      type: data.type,
      risk: data.risk,
      complaint: data.complaint,
      expectedDischarge: data.expectedDischarge,
      diagnosis: data.diagnosis,
      prognosis: data.prognosis,
      status: data.status,
      economic_group_id: group.id,
      business_unit_id: unitId,
      patient_id: data.patientId,
      tutor_id: data.tutorId,
      bed_id: data.bedId,
      technician_id: data.userId ?? user.id,
    });

    if (occurrence) {
      await ent.related('occurrences').create({
        occurrence_id: occurrence.id,
        description: `Internação do paciente ${patient?.name} por ${
          user.name
        } às ${DateTime.local().toFormat('dd/MM/yyyy HH:mm')}`,
        executedAt: DateTime.now(),
        user_id: user.id,
      });
    } else {
      Logger.error(
        'Não existe ocorrência de internação cadastrada para o grupo econômico',
      );
    }

    if ([-1].includes(data.type)) {
      const tutor = await Patient.findOrFail(data.tutorId);
      const patient = await Patient.findOrFail(data.patientId);
      const bed = await Bed.findOrFail(data.bedId);

      await HospitalizationTimeline.create({
        data: {
          hospitalization_id: ent.id,
          patient: {
            id: patient.id,
            name: patient.name,
          },
          tutor: {
            id: tutor.id,
            name: tutor.name,
          },
          user: {
            id: user.id,
            name: user.name,
          },
          type: data.type,
          risk: data.risk,
          complaint: data.complaint,
          diagnosis: data.diagnosis,
          prognosis: data.prognosis,
          expectedDischarge: data.expectedDischarge,
          bed: {
            id: bed.id,
            name: bed.name,
            tag: bed.tag,
          },
          status: data.status,
        },
      });
    }

    return this.show(unitId, ent.id);
  }

  public async update(
    unitId: string,
    id: string,
    user: User,
    data: IHospitalizationData,
  ) {
    const ent = await this.show(unitId, id);

    await ent
      .merge({
        type: data.type,
        risk: data.risk,
        complaint: data.complaint,
        expectedDischarge: data.expectedDischarge,
        diagnosis: data.diagnosis,
        prognosis: data.prognosis,
        status: data.status,
        patient_id: data.patientId,
        tutor_id: data.tutorId,
        bed_id: data.bedId,
        technician_id: data.userId ?? user.id,
      })
      .save();

    return this.show(unitId, ent.id);
  }

  public async destroy(unitId: string, id: string) {
    const ent = await this.show(unitId, id);

    await ent.softDelete();
  }
}
