import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Schedule from 'App/Models/Schedule';
import Treatment from 'App/Models/Treatment';
import TreatmentExecution from 'App/Models/TreatmentExecution';
import TreatmentExecutionReschedule from 'App/Models/TreatmentExecutionReschedule';
import TreatmentItem from 'App/Models/TreatmentItem';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import { DateTime } from 'luxon';

@inject()
export default class TreatmentService {
  constructor(private shared: SharedService) {}

  public async create(
    authCtx: AuthContext,
    data: {
      billId?: string;
      clientId: string;
      sellerId: string;

      emissionDate: DateTime;
    },
  ) {
    return Database.transaction(async trx => {
      return Treatment.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,

          bill_id: data.billId,
          emission_user_id: authCtx.user.id,
          client_id: data.clientId,
          seller_id: data.sellerId,

          emissionDate: data.emissionDate,
          status: data.billId ? 'Confirmado' : 'Aberto',
        },
        {
          client: trx,
        },
      );
    });
  }

  public async createItem(
    authCtx: AuthContext,
    data: {
      treatmentId: number;
      kitId?: number;
      productVariationId: string;

      quantity: number;
    },
  ) {
    return Database.transaction(async trx => {
      const existingItem = await TreatmentItem.query()
        .useTransaction(trx)
        .where('treatment_id', data.treatmentId);

      return TreatmentItem.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          kit_id: data.kitId,
          product_variation_id: data.productVariationId,

          id: existingItem.length + 1,
          treatment_id: data.treatmentId,
          quantity: data.quantity,
          quantityExecuted: 0,
          status: 'Ativo',
        },
        {
          client: trx,
        },
      );
    });
  }

  public async createExecution(
    authCtx: AuthContext,
    data: {
      treatmentId: number;
      treatmentItemId: number;
      scheduleId: string;

      quantityExecuted: number;
      scheduleDate: DateTime;
    },
  ) {
    return Database.transaction(async trx => {
      const existingExecutions = await TreatmentExecution.query()
        .useTransaction(trx)
        .where('treatment_id', data.treatmentId)
        .where('treatment_item_id', data.treatmentItemId);

      return TreatmentExecution.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          schedule_id: data.scheduleId,
          schedule_user_id: authCtx.user.id,

          id: existingExecutions.length + 1,
          treatment_id: data.treatmentId,
          treatment_item_id: data.treatmentItemId,

          quantityExecuted: data.quantityExecuted,
          scheduleDate: DateTime.now(),
          status: 'Ativo',
        },
        {
          client: trx,
        },
      );
    });
  }

  public async executeExecution(
    authCtx: AuthContext,
    data: {
      executionId: number;

      executionDate: DateTime;
      observations: string;
    },
  ) {
    return Database.transaction(async trx => {
      const execution = await TreatmentExecution.findOrFail(data.executionId, {
        client: trx,
      });

      if (execution.status !== 'Ativo') {
        throw new BadRequestException(
          'Execução já foi finalizada',
          400,
          'E_ERR',
        );
      }

      await execution
        .merge({
          execution_user_id: authCtx.user.id,

          executionDate: data.executionDate,
          observations: data.observations,
          status: 'Confirmado',
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async cancelTreatment(
    authCtx: AuthContext,
    data: {
      treatmentId: number;
      reasonId: string;

      cancellationDate: DateTime;
      cancellationObservations: string;
    },
  ) {
    return Database.transaction(async trx => {
      const execution = await Treatment.findOrFail(data.treatmentId, {
        client: trx,
      });

      if (execution.status === 'Cancelado') {
        throw new BadRequestException(
          'Status inválido de execução',
          400,
          'E_ERR',
        );
      }

      await execution
        .merge({
          cancellation_user_id: authCtx.user.id,
          cancellation_reason_id: data.reasonId,

          cancellationDate: data.cancellationDate,
          cancellationObservations: data.cancellationObservations,
          status: 'Cancelado',
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async searchCompleteTreatments(
    authCtx: AuthContext,
    data: {
      treatment?: string;
    },
  ) {
    if (!data.treatment) {
      throw new BadRequestException('Tratamento não informado', 400, 'E_ERR');
    }

    const treatments = await Treatment.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .where('id', data.treatment)
      .preload('items')
      .preload('executions')
      .preload('bill')
      .preload('seller')
      .preload('cancellationUser')
      .preload('cancellationReason')
      .preload('emissionUser')
      .preload('client');

    return treatments.map(elem => ({
      id: elem.id,
      bill: {
        id: elem.bill.id,
        tag: elem.bill.tag,
      },
      seller: {
        id: elem.seller.id,
        name: elem.seller.name,
      },
      emissionDate: elem.emissionDate,

      cancellationUser: {
        id: elem.cancellationUser?.id ?? null,
        name: elem.cancellationUser?.name ?? null,
      },
      cancellationDate: elem.cancellationDate,

      cancellationReason: {
        id: elem.cancellationReason?.id ?? null,
        reason: elem.cancellationReason?.reason ?? null,
      },
      cancellationObservations: elem.cancellationObservations,

      observations: elem.observations,

      emissionUser: {
        id: elem.emissionUser.id,
        name: elem.emissionUser.name,
      },

      client: {
        id: elem.client.id,
        name: elem.client.name,
      },
      status: elem.status,
    }));
  }

  public async searchTreatments(
    authCtx: AuthContext,
    data: {
      from?: string;
      to?: string;
      patient?: string;
      tag?: string;
      status?: string;
    },
  ) {
    const qb = Treatment.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .preload('client')
      .preload('seller');

    if (data.from) {
      qb.where('emission_date', '>=', data.from);
    }

    if (data.to) {
      qb.where('emission_date', '<=', data.to);
    }

    if (data.patient) {
      qb.where('client_id', data.patient);
    }

    if (data.tag) {
      qb.whereHas('bill', query => {
        query.where('tag', data.tag ?? '-');
      });
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    const treatments = await qb;
    return treatments.map(elem => ({
      id: elem.id,
      emissionDate: elem.emissionDate,
      seller: {
        id: elem.seller.id,
        name: elem.seller.name,
      },
      client: {
        id: elem.client.id,
        name: elem.client.name,
      },
      status: elem.status,
    }));
  }

  public async searchTreatmentItems(
    authCtx: AuthContext,
    data: {
      treatment?: string;
    },
  ) {
    if (!data.treatment) {
      throw new BadRequestException('Tratamento não informado', 400, 'E_ERR');
    }

    const treatment = await Treatment.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .where('id', data.treatment)
      .preload('items', query => {
        query.preload('kit');
        query.preload('productVariation', query => {
          query.preload('product');
        });
      })
      .first();

    if (!treatment) {
      throw this.shared.ResourceNotFound();
    }

    return treatment.items.map(elem => ({
      id: elem.id,
      kit: {
        id: elem.kit?.id ?? null,
        description: elem.kit?.description ?? null,
      },
      productVariation: {
        id: elem.productVariation.id,
        description: elem.productVariation.product.description,
      },
      quantity: elem.quantity,
      quantityExecuted: elem.quantityExecuted,
      observations: elem.observations,
      status: elem.status,
    }));
  }

  public async searchTreatmentExecutions(
    authCtx: AuthContext,
    data: {
      treatment?: string;
    },
  ) {
    if (!data.treatment) {
      throw new BadRequestException('Tratamento não informado', 400, 'E_ERR');
    }

    const treatment = await Treatment.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .where('id', data.treatment)
      .preload('executions', query => {
        query.preload('scheduleUser');
        query.preload('executionUser');
        query.preload('schedule');
      })
      .first();

    if (!treatment) {
      throw this.shared.ResourceNotFound();
    }

    return treatment.executions.map(elem => ({
      id: elem.id,
      item: {
        id: elem.treatment_item_id,
      },
      scheduleUser: {
        id: elem.scheduleUser.id,
        name: elem.scheduleUser.name,
      },
      executionUser: elem.executionUser
        ? {
            id: elem.executionUser.id,
            name: elem.executionUser.name,
          }
        : null,
      scheduleDate: elem.scheduleDate,
      schedule: {
        id: elem.schedule.id,
      },
      executionDate: elem.executionDate,
      quantityExecuted: elem.quantityExecuted,
      observations: elem.observations,
      status: elem.status,
      createdAt: elem.createdAt,
    }));
  }

  public async searchClientScheduling(
    authCtx: AuthContext,
    data: {
      client?: string;
      from?: string;
      to?: string;
    },
  ) {
    if (!data.client) {
      throw new BadRequestException('Paciente não informado', 400, 'E_ERR');
    }

    const schedules = await Schedule.query()
      .where('business_unit_id', authCtx.unit.id)
      .where('patient_id', data.client)
      .preload('serviceType')
      .preload('serviceStatus');

    return schedules.map(elem => ({
      id: elem.id,
      startHour: elem.startHour,
      endHour: elem.endHour,
      service: {
        id: elem.serviceType.id,
        description: elem.serviceType.description,
      },
      status: {
        id: elem.serviceStatus.id,
        description: elem.serviceStatus.description,
      },
    }));
  }

  public async updateTreatmentExecution(
    authCtx: AuthContext,
    data: {
      treatmentExecutionId: number;
      reasonId: string;
      scheduleId: string;

      observations: string;
    },
  ) {
    await Database.transaction(async trx => {
      const treatmentExecution = await TreatmentExecution.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.treatmentExecutionId)
        .first();

      if (!treatmentExecution) {
        throw this.shared.ResourceNotFound();
      }

      const reschedules = await TreatmentExecutionReschedule.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('treatment_id', treatmentExecution.treatment_id)
        .where('treatment_item_id', treatmentExecution.treatment_item_id);

      await TreatmentExecutionReschedule.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          treatment_id: treatmentExecution.treatment_id,
          treatment_item_id: treatmentExecution.treatment_item_id,
          treatment_item_execution_id: treatmentExecution.id,
          id: reschedules.length + 1,

          reschedule_user_id: authCtx.user.id,
          rescheduleDate: DateTime.now(),
          reason_id: data.reasonId,
          observations: data.observations,
          schedule_user_id: treatmentExecution.schedule_user_id,
          scheduleDate: treatmentExecution.scheduleDate,
          evaluationId: treatmentExecution.schedule_id,
        },
        { client: trx },
      );

      await treatmentExecution
        .merge({
          schedule_user_id: authCtx.user.id,
          scheduleDate: DateTime.now(),
          schedule_id: data.scheduleId,
        })
        .useTransaction(trx)
        .save();
    });
  }
}
