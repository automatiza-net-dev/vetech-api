import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import Treatment from 'App/Models/Treatment';
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
}
