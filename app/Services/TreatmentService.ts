import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Treatment from 'App/Models/Treatment';
import TreatmentExecution from 'App/Models/TreatmentExecution';
import TreatmentItem from 'App/Models/TreatmentItem';
import { AuthContext } from 'App/Services/SharedService';
import { DateTime } from 'luxon';

@inject()
export default class TreatmentService {
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
}
