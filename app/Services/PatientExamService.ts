import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import PatientExam from 'App/Models/PatientExam';
import User from 'App/Models/User';
import IPatientExamData, {
  IPatientExamAttachmentData,
} from 'Contracts/interfaces/IPatientExamData';
import { v4 } from 'uuid';

@inject()
export default class PatientExamService {
  public async index(unitId: string) {
    const qb = PatientExam.query().where('business_id', unitId);

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
    return PatientExam.create({
      realizedAt: data.realizedAt,
      laboratory: data.laboratory,
      report: data.report,
      business_id: unitId,
      exam_id: data.examId,
      patient_id: data.patientId,
      schedule_id: data.scheduleId,
      user_id: user.id,
      solicitor_id: data.solicitorId,
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: Omit<IPatientExamData, 'examId'>,
  ) {
    const ent = await PatientExam.query()
      .where('business_id', unitId)
      .where('id', id)
      .first();

    if (!ent) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    ent.merge({
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
    });

    return ent.save();
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
