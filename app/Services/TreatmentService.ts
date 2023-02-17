import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import Patient from 'App/Models/Patient';
import Schedule from 'App/Models/Schedule';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import TimelineType, { APPOINTMENT_UUID } from 'App/Models/TimelineType';
import Treatment from 'App/Models/Treatment';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import { ICreateTreatment } from 'Contracts/interfaces/ITreatmentData';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

interface ISearch {
  description?: string;
  resume?: string;
  patient?: string;
  tutor?: string;
}

@inject()
export default class TreatmentService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const qb = Treatment.query().where('business_unit_id', unitId);

    if (data.resume) {
      qb.whereILike('resume', `%${data.resume}`);
    }

    if (data.patient) {
      qb.where('patient_id', data.patient);
    }

    if (data.tutor) {
      qb.where('tutor_id', data.tutor);
    }

    if (data.description) {
      qb.whereHas('scheduleService', query => {
        query.whereILike('description', `%${data.description}`);
      });
    }

    return qb;
  }

  public async show(unitId: string, id: string) {
    const treatment = await Treatment.query()
      .where('business_unit_id', unitId)
      .where('id', id)
      .first();

    if (!treatment) {
      throw this.sharedService.ResourceNotFound();
    }

    return treatment;
  }

  public async open(unitId: string, user: User, data: ICreateTreatment) {
    if (!data.scheduleId && !data.patientId) {
      throw new BadRequestException(
        'É preciso informar agendamento ou paciente',
        400,
        'E_ERR',
      );
    }

    const parsedData: Partial<Treatment> = {
      business_unit_id: unitId,
      open_user_id: user.id,
      schedule_service_id: data.scheduleServiceId,
      resume: data.resume,
      protocol: data.protocol,
      startDate: DateTime.now(),
    };

    await Database.transaction(async trx => {
      const serviceType = await ScheduleServiceType.findOrFail(
        data.scheduleServiceId,
      );

      if (data.scheduleId) {
        const schedule = await Schedule.findOrFail(data.scheduleId, {
          client: trx,
        });

        parsedData.schedule_id = data.scheduleId;
        parsedData.patient_id = schedule.patient_id;
        parsedData.tutor_id = schedule.holder_id;
      } else {
        const patient = await Patient.query()
          .useTransaction(trx)
          .where('id', data.patientId ?? v4())
          .preload('tutors', query => {
            query
              .preload('tutor', query => {
                query.preload('clientOrigin');
              })
              .pivotColumns(['is_main']);
          })
          .firstOrFail();
        const mainTutor = patient.tutors.find(t => t.$extras.pivot_is_main);
        if (!mainTutor) {
          throw new BadRequestException(
            'Paciente sem tutor ativo',
            400,
            'E_ERR',
          );
        }

        parsedData.patient_id = data.patientId;
        parsedData.tutor_id = mainTutor.id;
      }

      const treatment = await Treatment.create(parsedData, {
        client: trx,
      });

      const timelineInfo = await TimelineType.findOrFail(APPOINTMENT_UUID, {
        client: trx,
      });

      await AnimalTimeline.create({
        timeline_id: APPOINTMENT_UUID,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          tag: treatment.patient_id,
          realized: DateTime.now(),
          resume: data.resume,
          protocol: data.protocol,
          technician: {
            id: user.id,
            name: user.name,
          },
          treatment: {
            id: treatment.id,
          },
          service: {
            id: serviceType.id,
            resume: serviceType.resume,
            description: serviceType.description,
          },
        },
      });
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: { resume: string; protocol: string },
  ) {
    const treatment = await this.show(unitId, id);

    await Database.transaction(async trx => {
      await treatment
        .useTransaction(trx)
        .merge({ resume: data.resume, protocol: data.protocol })
        .save();

      await AnimalTimeline.updateOne(
        {
          timeline_id: APPOINTMENT_UUID,
          'timeline_info.treatment.id': treatment.id,
        },
        {
          $set: {
            'timeline_info.resume': data.resume,
            'timeline_info.protocol': data.protocol,
          },
        },
        {},
      );
    });
  }

  public async close(unitId: string, user: User, id: string) {
    const treatment = await this.show(unitId, id);

    if (treatment.endDate) {
      throw new BadRequestException('Tratamento já finalizado', 400, 'E_ERR');
    }

    await treatment
      .merge({ endDate: DateTime.now(), close_user_id: user.id })
      .save();
  }
}
