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
  ATTENDANCE_UUID,
  HOSPITALIZATION_UUID,
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

interface IHome {
  hospitalized_from?: string;
  hospitalized_to?: string;

  death_from?: string;
  death_to?: string;

  released_from?: string;
  released_to?: string;

  type?: number;
  status?: string;
  patient?: string;
}

@inject()
export default class HospitalizationService {
  constructor(private readonly sharedService: SharedService) {}

  public async parsedIndex(unitId: string, data: IHome) {
    const qb = Hospitalization.query()
      .where('business_unit_id', unitId)
      .preload('patient')
      .preload('tutor')
      .preload('technician')
      .preload('bed');

    if (data.hospitalized_from) {
      qb.where('created_at', '>=', data.hospitalized_from);
    }

    if (data.hospitalized_to) {
      qb.where('created_at', '<=', data.hospitalized_to);
    }

    if (data.death_from) {
      qb.where('deathAt', '>=', data.death_from);
    }

    if (data.death_to) {
      qb.where('deathAt', '<=', data.death_to);
    }

    if (data.released_from) {
      qb.where('releasedAt', '>=', data.released_from);
    }

    if (data.released_to) {
      qb.where('releasedAt', '<=', data.released_to);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    if (data.patient) {
      qb.where('patient_id', data.patient);
    }

    const result = await qb;

    return result.map(r => ({
      id: r.id,
      patient: {
        id: r.patient.id,
        name: r.patient.name,
      },
      tutor: {
        id: r.tutor.id,
        name: r.tutor.name,
      },
      technician: {
        id: r.technician.id,
        name: r.technician.name,
      },
      type: r.type,
      risk: r.risk,
      bed: r.bed
        ? {
            id: r.bed.id,
            name: r.bed.name,
            tag: r.bed.tag,
          }
        : null,
      complaint: r.complaint,
      diagnosis: r.diagnosis,
      prognosis: r.prognosis,
      expectedDischarge: r.expectedDischarge,
      hospitalizedAt: r.createdAt,
      releasedAt: r.releasedAt,
      deathAt: r.deathAt,
      status: r.status,
    }));
  }

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
          query.preload('hair');
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

    return hospitalization;
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
        meta: {
          hospitalization: ent.id,
          group: group.id,
          unit: unitId,
          type: 'begin_hospitalization',
        },
        data: {
          tutor: {
            id: tutor.id,
            name: tutor.name,
          },
          patient: {
            id: patient.id,
            name: patient.name,
          },
          technician: {
            id: technician.id,
            name: technician.name,
          },
          type: HospitalizationType[data.type],
          risk: data.risk,
          complaint: data.complaint,
          diagnosis: data.diagnosis,
          prognosis: data.prognosis,
          expectedDischarge: data.expectedDischarge,
          hospitalizedAt: ent.createdAt,
          releasedAt: null,
          deathAt: null,
          bed: bed
            ? {
                id: bed?.id,
                name: bed?.name,
                tag: bed?.tag,
              }
            : null,
          status: data.status,
        },
      });

      const attendanceTimelineInfo = await TimelineType.findOrFail(
        ATTENDANCE_UUID,
        {
          client: trx,
        },
      );

      await AnimalTimeline.create({
        timeline_id: ATTENDANCE_UUID,
        timeline_type: {
          description: attendanceTimelineInfo.description,
          color: attendanceTimelineInfo.color,
          requires_observation: attendanceTimelineInfo.requiresObservation,
        },
        timeline_info: {
          tag: ent.patient_id,
          event: 'INTERNACAO',
          realized: DateTime.now(),
          complaint: data.complaint,
          expectedDischarge: data.expectedDischarge,
          diagnosis: data.diagnosis,
          prognosis: data.prognosis,
          type: HospitalizationType[data.type],
          risk: data.risk,
          technician: {
            id: user.id,
            name: user.name,
          },
          bed: bed
            ? {
                id: bed?.id,
                name: bed?.name,
                tag: bed?.tag,
              }
            : null,
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
    const group = await this.sharedService.getUserGroup(unitId);
    const hospitalization = await Hospitalization.query()
      .where('id', id)
      .preload('patient')
      .preload('bed')
      .first();

    if (!hospitalization || hospitalization.business_unit_id !== unitId) {
      throw this.sharedService.ResourceNotFound();
    }

    await Database.transaction(async trx => {
      const updatedHospitalization = await hospitalization
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
          releasedAt:
            data.status === HospitalizationStatus.COMPLETE
              ? DateTime.now()
              : undefined,
        })
        .useTransaction(trx)
        .save();

      if (data.status === HospitalizationStatus.COMPLETE) {
        const timelineInfo = await TimelineType.findOrFail(
          HOSPITALIZATION_UUID,
          {
            client: trx,
          },
        );

        await AnimalTimeline.create({
          timeline_id: HOSPITALIZATION_UUID,
          timeline_type: {
            description: timelineInfo.description,
            color: timelineInfo.color,
            requires_observation: timelineInfo.requiresObservation,
          },
          timeline_info: {
            tag: hospitalization.id,
            hospitalization: {
              id: updatedHospitalization.id,
              type: updatedHospitalization.type,
            },
            complaint: updatedHospitalization.complaint,
            bed: {
              id: updatedHospitalization.bed?.id,
              name: updatedHospitalization.bed?.name,
              tag: updatedHospitalization.bed?.tag,
            },
            hospitalizedAt: updatedHospitalization.createdAt,
            releasedAt: updatedHospitalization.releasedAt,
            deathAt: updatedHospitalization.deathAt,
            completedAt: DateTime.now(),
            technician: {
              id: user.id,
              name: user.name,
            },
          },
        });

        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            group: group.id,
            unit: unitId,
            origin: 'hospitalization_completed',
          },
          data: {
            tutor: {
              id: hospitalization.tutor.id,
              name: hospitalization.tutor.name,
            },
            patient: {
              id: hospitalization.patient.id,
              name: hospitalization.patient.name,
            },
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            completedAt: DateTime.now(),
            technician: {
              id: user.id,
              name: user.name,
            },
          },
        });
      }
    });

    return this.show(unitId, hospitalization.id);
  }

  public async destroy(unitId: string, id: string) {
    const hospitalization = await Hospitalization.find(id);

    if (!hospitalization || hospitalization.business_unit_id !== unitId) {
      throw this.sharedService.ResourceNotFound();
    }

    await hospitalization.softDelete();
  }

  public async completeHospitalization(unitId: string, id: string, user: User) {
    const group = await this.sharedService.getUserGroup(unitId);

    const hospitalization = await Hospitalization.query()
      .where('business_unit_id', unitId)
      .where('id', id)
      .preload('patient')
      .preload('bed')
      .preload('tutor')
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

    await Database.transaction(async trx => {
      await hospitalization
        .merge({
          releasedAt: DateTime.now(),
          status: HospitalizationStatus.COMPLETE,
        })
        .useTransaction(trx)
        .save();

      await HospitalizationTimeline.create({
        meta: {
          hospitalization: hospitalization.id,
          group: group.id,
          unit: unitId,
          origin: 'hospitalization_completed',
        },
        data: {
          tutor: {
            id: hospitalization.tutor.id,
            name: hospitalization.tutor.name,
          },
          patient: {
            id: hospitalization.patient.id,
            name: hospitalization.patient.name,
          },
          type: HospitalizationType[hospitalization.type],
          hospitalizedAt: hospitalization.createdAt,
          completedAt: DateTime.now(),
          technician: {
            id: user.id,
            name: user.name,
          },
        },
      });

      // const attendanceTimelineInfo = await TimelineType.findOrFail(
      //   ATTENDANCE_UUID,
      //   {
      //     client: trx,
      //   },
      // );

      // await AnimalTimeline.create({
      //   timeline_id: ATTENDANCE_UUID,
      //   timeline_type: {
      //     description: attendanceTimelineInfo.description,
      //     color: attendanceTimelineInfo.color,
      //     requires_observation: attendanceTimelineInfo.requiresObservation,
      //   },
      //   timeline_info: {
      //     tag: updatedHospitalization.patient_id,
      //     event: 'ALTA',
      //     realized: DateTime.now(),
      //     complaint: updatedHospitalization.complaint,
      //     expectedDischarge: updatedHospitalization.expectedDischarge,
      //     diagnosis: updatedHospitalization.diagnosis,
      //     prognosis: updatedHospitalization.prognosis,
      //     technician: {
      //       id: user.id,
      //       name: user.name,
      //     },
      //   },
      // });
    });
  }
}
