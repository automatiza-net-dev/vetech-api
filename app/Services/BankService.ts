import { inject } from '@adonisjs/fold';
import Bank from 'App/Models/Bank';

interface ISearch {
  name?: string;
  code?: string;
  active?: string;
}

@inject()
export default class BankService {
  public async index(data: ISearch) {
    const qb = Bank.query();

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    if (data.code) {
      qb.where('code', 'ilike', `%${data.code}%`);
    }

    if (data.active) {
      qb.where('active', data.active === 'true');
    }

    return qb;
  }
}
