import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import Treatment from 'App/Models/Treatment';
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
      const existingItem = await TreatmentItem.query().where(
        'treatment_id',
        data.treatmentId,
      );

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
}
