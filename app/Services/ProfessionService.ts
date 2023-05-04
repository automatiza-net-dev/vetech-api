import { inject } from '@adonisjs/fold';
import Profession from 'App/Models/Profession';
import SharedService from 'App/Services/SharedService';

interface ISearch {
  description?: string;
}

@inject()
export default class ProfessionService {
  constructor(protected readonly sharedService: SharedService) {}

  async index(data: ISearch) {
    const qb = Profession.query();

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    return qb;
  }

  async show(id: number): Promise<Profession> {
    const profession = await Profession.query()
      .where('id', id)

      .first();

    if (!profession) {
      throw this.sharedService.ResourceNotFound();
    }

    return profession;
  }
}
