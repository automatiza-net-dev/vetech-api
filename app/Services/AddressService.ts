import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import Address, { AddressTypes } from 'App/Models/Address';
import SharedService, { AuthContext } from 'App/Services/SharedService';

@inject()
export default class AddressService {
  constructor(private sharedService: SharedService) {}

  async index(authCtx: AuthContext) {
    return Address.query()
      .where('user_id', authCtx.user.id)
      .orderBy('main', 'desc')
      .orderBy('created_at', 'desc');
  }

  async store(
    authCtx: AuthContext,
    data: {
      main: boolean;
      code: number;
      type: typeof AddressTypes[number];
      postalCode: string;
      address: string;
      number: string;
      complement: string;
      district: string;
      city: string;
      state: string;
    },
  ) {
    await Database.transaction(async trx => {
      if (data.main) {
        await Address.query()
          .useTransaction(trx)
          .where('user_id', authCtx.user.id)
          .update({ main: false });
      }

      await Address.create(
        {
          ...data,
          user_id: authCtx.user.id,
        },
        {
          client: trx,
        },
      );
    });
  }

  async show(authCtx: AuthContext, id: number) {
    const addr = await Address.query()
      .where('user_id', authCtx.user.id)
      .where('id', id)
      .first();

    if (!addr) {
      throw this.sharedService.ResourceNotFound();
    }

    return addr;
  }

  async update(
    authCtx: AuthContext,
    id: number,
    data: {
      main: boolean;
      code: number;
      type: typeof AddressTypes[number];
      postalCode: string;
      address: string;
      number: string;
      complement: string;
      district: string;
      city: string;
      state: string;
      active: boolean;
    },
  ) {
    await Database.transaction(async trx => {
      const addr = await Address.query()
        .useTransaction(trx)
        .where('user_id', authCtx.user.id)
        .where('id', id)
        .first();

      if (!addr) {
        throw this.sharedService.ResourceNotFound();
      }

      if (data.main) {
        await Address.query()
          .useTransaction(trx)
          .where('user_id', authCtx.user.id)
          .update({ main: false });
      }

      await addr.merge(data).useTransaction(trx).save();
    });
  }

  async destroy(authCtx: AuthContext, id: number) {
    const addr = await Address.query()
      .where('user_id', authCtx.user.id)
      .where('id', id)
      .first();

    if (!addr) {
      throw this.sharedService.ResourceNotFound();
    }

    await addr.delete();
  }
}
