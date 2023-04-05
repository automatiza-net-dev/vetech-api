import { inject } from '@adonisjs/fold';
import Brand from 'App/Models/Brand';
import SharedService from 'App/Services/SharedService';

interface ISearch {
  description?: string;
}

@inject()
export default class BrandService {
  constructor(private sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Brand.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null)',
      [group.id],
    );

    if (data.description) {
      qb.whereILike('description', `%${data.description}%`);
    }

    return qb;
  }
}
