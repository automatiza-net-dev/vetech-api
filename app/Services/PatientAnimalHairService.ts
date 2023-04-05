import { inject } from '@adonisjs/fold';
import PatientAnimalHair from 'App/Models/PatientAnimalHair';
import SharedService from 'App/Services/SharedService';

interface ISearch {
  description?: string;
}

@inject()
export default class PatientAnimalHairService {
  constructor(private sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = PatientAnimalHair.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null)',
      [group.id],
    );

    if (data.description) {
      qb.whereILike('description', `%${data.description}%`);
    }

    return qb;
  }
}
