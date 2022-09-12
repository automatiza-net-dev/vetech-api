import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import PatientExam from 'App/Models/PatientExam';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IPatientExamData from 'Contracts/interfaces/IPatientExamData';

@inject()
export default class PatientExamService {
  constructor(private sharedService: SharedService) {}

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
    });
  }

  public async update(unitId: string, id: string, data: IPatientExamData) {
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
      exam_id: data.examId,
      patient_id: data.patientId,
      schedule_id: data.scheduleId,
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
}
