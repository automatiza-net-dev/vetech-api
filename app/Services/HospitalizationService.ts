import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Bed from 'App/Models/Bed';
import Hospitalization, {
  HospitalizationStatus,
  HospitalizationType,
} from 'App/Models/Hospitalization';
import HospitalizationMedicalPrescriptionScheduling from 'App/Models/HospitalizationMedicalPrescriptionScheduling';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import HospitalizationTimeline from 'App/Models/mongoose/HospitalizationTimeline';
import Occurrence, { OccurrenceType } from 'App/Models/Occurrence';
import Patient from 'App/Models/Patient';
import TimelineType, {
  HOSPITALIZATION_UUID,
  WEIGHT_UUID,
} from 'App/Models/TimelineType';
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
    const hospitalization = await Hospitalization.find(id);

    if (!hospitalization || hospitalization.business_unit_id !== unitId) {
      throw this.sharedService.ResourceNotFound();
    }

    return HospitalizationTimeline.find({
      hospitalization_id: hospitalization.id,
    });
  }

  public async index(unitId: string, data: ISearch) {
    const qb = Hospitalization.query()
      .preload('bed')
      .preload('patient', query => {
        query.preload('patientAnimal', query => {
          query.preload('race', query => {
            query.preload('specie');
          });
        });
      })
      .preload('tutor', query => {
        query.preload('tutor', query => {
          query.select(['cellphone']);
        });
      })
      .preload('technician')
      .preload('medicalPrescriptions', query => {
        query.preload('prescriptionUnit');
        query.preload('fluidUnit');
        query.preload('drugAdministration');
        query.preload('user');
        query.preload('scheduling');
      })
      .preload('occurrences', query => {
        query.preload('occurrence');
        query.preload('user');
        query.preload('prescription');
        query.preload('attachments');
      })
      .preload('parameters', query => {
        query.preload('parameter');
        query.preload('user');
      });

    qb.where('business_unit_id', unitId).where(
      'status',
      HospitalizationStatus.ACTIVE,
    );

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

  public async completedIndex(unitId: string, data: ISearch) {
    const qb = Hospitalization.query()
      .preload('bed')
      .preload('patient', query => {
        query.preload('patientAnimal', query => {
          query.preload('race', query => {
            query.preload('specie');
          });
        });
      })
      .preload('tutor', query => {
        query.preload('tutor', query => {
          query.select(['cellphone']);
        });
      })
      .preload('technician')
      .preload('medicalPrescriptions', query => {
        query.preload('prescriptionUnit');
        query.preload('fluidUnit');
        query.preload('drugAdministration');
        query.preload('user');
      })
      .preload('occurrences', query => {
        query.preload('occurrence');
        query.preload('user');
        query.preload('prescription');
        query.preload('attachments');
      })
      .preload('parameters', query => {
        query.preload('parameter');
        query.preload('user');
      });

    qb.where('business_unit_id', unitId).where(
      'status',
      HospitalizationStatus.COMPLETE,
    );

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
      .preload('patient', query => {
        query.preload('patientAnimal', query => {
          query.preload('race', query => {
            query.preload('specie');
          });
        });
      })
      .preload('tutor')
      .preload('technician')
      .preload('medicalPrescriptions', query => {
        query.preload('prescriptionUnit');
        query.preload('fluidUnit');
        query.preload('drugAdministration');
        query.preload('user');
      })
      .preload('occurrences', query => {
        query.preload('occurrence');
        query.preload('user');
        query.preload('prescription');
        query.preload('attachments');
      })
      .preload('parameters', query => {
        query.preload('parameter');
        query.preload('user');
      });

    qb.where('business_unit_id', unitId).where('id', id);

    const hospitalization = await qb.first();

    if (!hospitalization) {
      throw this.sharedService.ResourceNotFound();
    }

    const [lastWeight] = await AnimalTimeline.find({
      'timeline_info.tag': hospitalization.patient_id,
      timeline_id: WEIGHT_UUID,
    });

    const result = hospitalization.toJSON();

    return Object.assign(result, {
      weight: lastWeight ? (lastWeight.timeline_info as any)?.weight : '-',
    });
  }

  public async getScheduling(unitId: string, id: string) {
    const qb = Hospitalization.query()
      .where('business_unit_id', unitId)
      .where('id', id);

    const hospitalization = await qb.first();

    if (!hospitalization) {
      throw this.sharedService.ResourceNotFound();
    }

    return HospitalizationMedicalPrescriptionScheduling.query().where(
      'hospitalization_id',
      hospitalization.id,
    );
  }

  public async store(unitId: string, user: User, data: IHospitalizationData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const ent = await Database.transaction(async trx => {
      const patient = await Patient.findOrFail(data.patientId);
      const tutor = await Patient.findOrFail(data.tutorId);
      const bed = data.bedId ? await Bed.findOrFail(data.bedId) : null;
      const technician = data.userId
        ? await User.findOrFail(data.userId)
        : user;

      const existingInternation = await Hospitalization.query()
        .useTransaction(trx)
        .where('business_unit_id', unitId)
        .where('patient_id', data.patientId)
        .where('status', HospitalizationStatus.ACTIVE)
        .first();
      if (existingInternation) {
        throw new BadRequestException(
          'Paciente já internado',
          400,
          'E_ALREADY_HOSPITALIZED',
        );
      }

      const occurrence = await Occurrence.query()
        .useTransaction(trx)
        .where('type', OccurrenceType.ADMISSAO_INTERNACAO)
        .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
          group.id,
        ])
        .first();

      const ent = await Hospitalization.create(
        {
          type: data.type,
          risk: data.risk,
          complaint: data.complaint,
          expectedDischarge: data.expectedDischarge,
          diagnosis: data.diagnosis,
          prognosis: data.prognosis,
          status: HospitalizationStatus.ACTIVE,
          economic_group_id: group.id,
          business_unit_id: unitId,
          patient_id: data.patientId,
          tutor_id: data.tutorId,
          bed_id: data.bedId,
          technician_id: technician.id,
        },
        {
          client: trx,
        },
      );

      if (occurrence) {
        await ent.related('occurrences').create(
          {
            occurrence_id: occurrence.id,
            description: `Internação do paciente ${patient?.name} por ${
              user.name
            } às ${DateTime.local().toFormat('dd/MM/yyyy HH:mm')}`,
            executedAt: DateTime.now(),
            user_id: user.id,
          },
          {
            client: trx,
          },
        );
      } else {
        Logger.error(
          'Não existe ocorrência de internação cadastrada para o grupo econômico',
        );
      }

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
          type: HospitalizationType[data.type],
          risk: data.risk,
          complaint: data.complaint,
          diagnosis: data.diagnosis,
          prognosis: data.prognosis,
          expectedDischarge: data.expectedDischarge,
          bed: {
            id: bed?.id,
            name: bed?.name,
            tag: bed?.tag,
          },
          status: data.status,
        },
      });

      const timelineInfo = await TimelineType.findOrFail(HOSPITALIZATION_UUID, {
        client: trx,
      });

      await AnimalTimeline.create({
        timeline_id: HOSPITALIZATION_UUID,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          hospitalization: {
            id: ent.id,
            type: HospitalizationType[data.type],
            risk: data.risk,
          },
          realized: DateTime.now(),
          expectedDischarge: data.expectedDischarge,
          bed: {
            id: bed?.id,
            name: bed?.name,
            tag: bed?.tag,
          },
          technician: {
            id: technician.id,
            name: technician.name,
          },
          complaint: data.complaint,
          diagnosis: data.diagnosis,
          prognosis: data.prognosis,
        },
      });

      return ent;
    });

    return this.show(unitId, ent.id);
  }

  public async update(
    unitId: string,
    id: string,
    user: User,
    data: IHospitalizationData,
  ) {
    const hospitalization = await Hospitalization.find(id);

    if (!hospitalization || hospitalization.business_unit_id !== unitId) {
      throw this.sharedService.ResourceNotFound();
    }

    await hospitalization
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

    return this.show(unitId, hospitalization.id);
  }

  public async destroy(unitId: string, id: string) {
    const hospitalization = await Hospitalization.find(id);

    if (!hospitalization || hospitalization.business_unit_id !== unitId) {
      throw this.sharedService.ResourceNotFound();
    }

    await hospitalization.softDelete();
  }

  public async completeHospitalization(unitId: string, id: string) {
    const hospitalization = await Hospitalization.query()
      .where('business_unit_id', unitId)
      .where('id', id)
      .first();

    if (!hospitalization) {
      throw this.sharedService.ResourceNotFound();
    }

    if (hospitalization.status === HospitalizationStatus.COMPLETE) {
      throw new BadRequestException(
        'Internação já finalizada',
        400,
        'E_CLOSED_ALREADY',
      );
    }

    await hospitalization
      .merge({ status: HospitalizationStatus.COMPLETE })
      .save();
  }
}
