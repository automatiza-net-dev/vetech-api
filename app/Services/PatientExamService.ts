import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import Database from '@ioc:Adonis/Lucid/Database';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Exam from 'App/Models/Exam';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import PatientExam from 'App/Models/PatientExam';
import TimelineType, { EXAM_UUID } from 'App/Models/TimelineType';
import User from 'App/Models/User';
import IPatientExamData, {
  IPatientExamAttachmentData,
} from 'Contracts/interfaces/IPatientExamData';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

interface ISearch {
  patient?: string;
  exam?: string;
}
@inject()
export default class PatientExamService {
  public async index(unitId: string, data: ISearch) {
    const qb = PatientExam.query().where('business_id', unitId);

    if (data.patient) {
      qb.where('patient_id', data.patient);
    }

    if (data.exam) {
      qb.where('exam_id', data.exam);
    }

    qb.preload('exam')
      .preload('patient')
      .preload('user')
      .preload('attachments')
      .preload('executor')
      .preload('solicitor');

    return qb;
  }

  public async show(unitId: string, id: string) {
    const ent = await PatientExam.query()
      .where('business_id', unitId)
      .where('id', id)
      .preload('exam')
      .preload('patient')
      .preload('user')
      .preload('attachments')
      .preload('executor')
      .preload('solicitor')
      .first();

    if (!ent) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    return ent;
  }

  public async store(unitId: string, user: User, data: IPatientExamData) {
    return Database.transaction(async trx => {
      const exam = await Exam.findOrFail(data.examId, {
        client: trx,
      });

      const patientExam = await PatientExam.create(
        {
          realizedAt: data.realizedAt,
          laboratory: data.laboratory,
          report: data.report,
          business_id: unitId,
          exam_id: data.examId,
          patient_id: data.patientId,
          schedule_id: data.scheduleId,
          user_id: user.id,
          solicitor_id: data.solicitorId,
        },
        {
          client: trx,
        },
      );

      const timelineInfo = await TimelineType.findOrFail(EXAM_UUID);

      await AnimalTimeline.create({
        timeline_id: EXAM_UUID,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          tag: patientExam.patient_id,
          realizedAt: data.realizedAt,
          laboratory: data.laboratory,
          report: data.report,
          technician: {
            id: user.id,
            name: user.name,
          },
          exam: {
            id: exam.id,
            name: exam.name,
          },
        },
      });
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: Omit<IPatientExamData, 'examId'> & { releasedAt?: DateTime },
  ) {
    const ent = await PatientExam.query()
      .where('business_id', unitId)
      .where('id', id)
      .first();

    if (!ent) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    return Database.transaction(async trx => {
      const updatedExam = await ent
        .merge({
          realizedAt: data.realizedAt,
          laboratory: data.laboratory,
          report: data.report,
          business_id: unitId,
          patient_id: data.patientId,
          schedule_id: data.scheduleId,
          executedAt: data.executedAt,
          executioner_id: data.executionerId,
          resultDate: data.resultDate,
          solicitor_id: data.solicitorId,
          status: data.status,
          releasedAt: data.releasedAt,
        })
        .useTransaction(trx)
        .save();

      await AnimalTimeline.updateOne(
        {
          timeline_id: EXAM_UUID,
          'exam.id': updatedExam.exam_id,
        },
        {
          $set: {
            laboratory: data.laboratory,
            report: data.report,
          },
        },
      );

      return updatedExam;
    });
  }

  public async destroy(unitId: string, id: string) {
    const ent = await PatientExam.query()
      .where('business_id', unitId)
      .where('id', id)
      .first();

    if (!ent) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    await ent.softDelete();
  }

  public async createAttachment(
    unitId: string,
    id: string,
    user: User,
    data: IPatientExamAttachmentData,
  ) {
    const ent = await PatientExam.query()
      .where('business_id', unitId)
      .where('id', id)
      .first();

    if (!ent) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    return ent.related('attachments').create({
      attachment: await this.uploadAttachment(data.attachment),
      user_id: user.id,
    });
  }

  public async deleteAttachment(
    unitId: string,
    id: string,
    attachmentId: string,
  ) {
    const ent = await PatientExam.query()
      .where('business_id', unitId)
      .where('id', id)
      .first();

    if (!ent) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    const attachment = await ent
      .related('attachments')
      .query()
      .where('id', attachmentId)
      .first();

    if (!attachment) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    await attachment.softDelete();
  }

  private async uploadAttachment(file: MultipartFileContract): Promise<string> {
    const key = `${v4()}.${file.extname}`;
    await file.moveToDisk(
      'patients',
      {
        name: key,
      },
      'local',
    );

    return Drive.getUrl(`patient-exam-attachments/${key}`);
  }
}
