import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import Schedule from 'App/Models/Schedule';
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
      executionDate: DateTime;
    },
  ) {
    return Database.transaction(async trx => {
      const existingExecutions = await TreatmentExecution.query()
        .useTransaction(trx)
        .where('treatment_id', data.treatmentId)
        .where('treatment_item_id', data.treatmentItemId);

      const schedule = await Schedule.findOrFail(data.scheduleId, {
        client: trx,
      });

      return TreatmentExecution.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          execution_user_id: authCtx.user.id,
          schedule_id: data.scheduleId,
          schedule_user_id: schedule.user_id,

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
}
