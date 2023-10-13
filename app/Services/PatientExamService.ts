import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Bill, { BillStatus } from 'App/Models/Bill';
import DailyCashier, { DailyCashierStatus } from 'App/Models/DailyCashier';
import Exam from 'App/Models/Exam';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import Patient from 'App/Models/Patient';
import PatientExam from 'App/Models/PatientExam';
import Product from 'App/Models/Product';
import TimelineType from 'App/Models/TimelineType';
import BillService from 'App/Services/BillService';
import { AuthContext } from 'App/Services/SharedService';
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
  constructor(private billService: BillService) {}

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

  public async store(authCtx: AuthContext, data: IPatientExamData) {
    return Database.transaction(async trx => {
      const exam = await Exam.findOrFail(data.examId, {
        client: trx,
      });

      const patient = await Patient.query()
        .useTransaction(trx)
        .where('id', data.patientId)
        .preload('tutors', query => {
          query.preload('tutor').pivotColumns(['is_main']);
        })
        .firstOrFail();

      if (exam.product_id) {
        const activeTutor = patient.tutors.find(
          tutor => tutor.$extras.pivot_is_main,
        );

        if (activeTutor) {
          const activeBilling = await Bill.query()
            .useTransaction(trx)
            .where('business_unit_id', authCtx.unit.id)
            .where('client_id', activeTutor.id)
            .where('patient_id', patient.id)
            .where('status', BillStatus.A)
            .first();

          const service = await Product.query()
            .useTransaction(trx)
            .where('id', exam.product_id)
            .preload('variations', query => {
              query.preload('businessUnitProducts', query => {
                query.where('businness_unit_id', authCtx.unit.id);
              });
            })
            .firstOrFail();
          const variation = service.variations.at(0);
          if (!variation) {
            throw new InternalErrorException(
              'Não foi possível encontrar a variação do serviço',
              400,
              'E_VARIATION_NOT_FOUND',
            );
          }

          const pricing = variation.businessUnitProducts.at(0);
          if (!pricing) {
            throw new InternalErrorException(
              'Não foi possível encontrar o preço do serviço',
              400,
              'E_PRICE_NOT_FOUND',
            );
          }

          if (activeBilling) {
            await this.billService.createBillItemWithTrx(trx, authCtx, {
              billId: activeBilling.id,
              discountValue: 0,
              productVariationId: variation.id,
              quantity: 1,
              unitaryValue: pricing.price,
            });
          } else {
            const userOpenCashier = await DailyCashier.query()
              .useTransaction(trx)
              .where('business_unit_id', authCtx.unit.id)
              .where('user_who_opened_id', authCtx.user.id)
              .where('status', DailyCashierStatus.A)
              .first();

            if (!userOpenCashier) {
              throw new BadRequestException(
                'Não foi possível encontrar o caixa aberto para o usuário',
                400,
                'E_BAD_REQUEST',
              );
            }

            await this.billService.createBillWithTrx(trx, authCtx, {
              billDate: DateTime.now(),
              clientId: activeTutor.id,
              patientId: patient.id,
              dailyMovementId: userOpenCashier.daily_movement_id,
              items: [
                {
                  discountValue: 0,
                  productVariationId: variation.id,
                  quantity: 1,
                  unitaryValue: pricing.price,
                },
              ],
            });
          }
        }
      }

      const patientExam = await PatientExam.create(
        {
          realizedAt: data.realizedAt,
          laboratory: data.laboratory,
          report: data.report,
          business_id: authCtx.unit.id,
          exam_id: data.examId,
          patient_id: data.patientId,
          schedule_id: data.scheduleId,
          user_id: authCtx.user.id,
          solicitor_id: data.solicitorId,
        },
        {
          client: trx,
        },
      );

      const timeline = await TimelineType.firstOrCreate(
        {
          description: 'Exames',
          system_id: authCtx.system.id,
        },
        {
          description: 'Exames',
          color: '#000',
          requiresObservation: false,
          system_id: authCtx.system.id,
        },
        {
          client: trx,
        },
      );

      await AnimalTimeline.create({
        timeline_id: timeline.id,
        timeline_type: {
          description: timeline.description,
          color: timeline.color,
          requires_observation: timeline.requiresObservation,
        },
        timeline_info: {
          tag: patientExam.patient_id,
          patient_exam: {
            id: patientExam.id,
          },
          realizedAt: data.realizedAt,
          laboratory: data.laboratory,
          report: data.report,
          technician: {
            id: authCtx.user.id,
            name: authCtx.user.name,
          },
          exam: {
            id: exam.id,
            name: exam.name,
          },
          attachments: [],
        },
      });

      return patientExam;
    });
  }

  public async update(
    authCtx: AuthContext,
    id: string,
    data: Omit<IPatientExamData, 'examId'> & { releasedAt?: DateTime },
  ) {
    const ent = await PatientExam.query()
      .where('business_id', authCtx.unit.id)
      .where('id', id)
      .first();

    if (!ent) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    return Database.transaction(async trx => {
      const timeline = await TimelineType.firstOrCreate(
        {
          description: 'Exames',
          system_id: authCtx.system.id,
        },
        {
          description: 'Exames',
          color: '#000',
          requiresObservation: false,
          system_id: authCtx.system.id,
        },
        {
          client: trx,
        },
      );

      const updatedExam = await ent
        .merge({
          laboratory: data.laboratory,
          report: data.report,
          business_id: authCtx.unit.id,
          patient_id: data.patientId,
          schedule_id: data.scheduleId,
          executedAt: data.executedAt,
          executioner_id: data.executionerId,
          resultDate: data.resultDate,
          solicitor_id: data.solicitorId,
          realizedAt: data.realizedAt,
          status: data.status,
          releasedAt: data.releasedAt,
        })
        .useTransaction(trx)
        .save();

      await AnimalTimeline.updateOne(
        {
          timeline_id: timeline.id,
          'timeline_info.patient_exam.id': updatedExam.id,
        },
        {
          $set: {
            'timeline_info.realizedAt': data.realizedAt,
            'timeline_info.laboratory': data.laboratory,
            'timeline_info.report': data.report,
            'timeline_info.executedAt': data.executedAt,
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
    authCtx: AuthContext,
    id: string,
    data: IPatientExamAttachmentData,
  ) {
    return Database.transaction(async trx => {
      const ent = await PatientExam.query()
        .useTransaction(trx)
        .where('business_id', authCtx.unit.id)
        .where('id', id)
        .first();

      if (!ent) {
        throw new ResourceNotFoundException('Recurso não encontrado');
      }

      const attachments = await Promise.all(
        data.attachments.map(async a => this.uploadAttachment(a)),
      );
      const result = await ent.related('attachments').createMany(
        attachments.map((url, index) => ({
          attachment: url,
          filename: data.attachments[index].clientName,
          user_id: authCtx.user.id,
        })),
        {
          client: trx,
        },
      );

      const timeline = await TimelineType.firstOrCreate(
        {
          description: 'Exames',
          system_id: authCtx.system.id,
        },
        {
          description: 'Exames',
          color: '#000',
          requiresObservation: false,
          system_id: authCtx.system.id,
        },
        {
          client: trx,
        },
      );

      await AnimalTimeline.updateOne(
        {
          timeline_id: timeline.id,
          'timeline_info.patient_exam.id': ent.id,
        },
        {
          $push: {
            'timeline_info.attachments': attachments,
          },
        },
      );

      return result;
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

    return Drive.getUrl(`patients/${key}`);
  }
}
