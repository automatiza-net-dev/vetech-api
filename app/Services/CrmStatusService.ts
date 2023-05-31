import { inject } from '@adonisjs/fold';
import CrmStatus, { CrmStatusType } from 'App/Models/CrmStatus';
import SharedService from 'app/Services/SharedService';

@inject()
export default class CrmStatusService {
  constructor(private sharedService: SharedService) {}

  public async index(data: { description?: string }) {
    const qb = CrmStatus.query().where('type', 'OP');

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    return qb;
  }

  public async show(id: number) {
    const elem = await CrmStatus.find(id);

    if (!elem) {
      throw this.sharedService.ResourceNotFound();
    }

    return elem;
  }

  public async store(data: {
    description: string;
    tag: string;
    type: CrmStatusType;
  }) {
    return CrmStatus.create(data);
  }

  public async update(
    id: number,
    data: {
      description: string;
      tag: string;
      type: CrmStatusType;
      active: boolean;
    },
  ) {
    const elem = await this.show(id);

    return elem.merge(data).save();
  }

  public async destroy(id: number) {
    const elem = await this.show(id);

    return elem.delete();
  }
}
