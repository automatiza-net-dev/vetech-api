import { inject } from '@adonisjs/fold';
import TemplateReplacement from 'App/Models/TemplateReplacement';
import SharedService from 'App/Services/SharedService';
import ITemplateReplacementData from 'Contracts/interfaces/ITemplateReplacementData';

interface ISearch {
  origin?: string;
  attribute?: string;
  replacer?: string;
}

@inject()
export default class TemplateReplacementService {
  constructor(private readonly sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = TemplateReplacement.query().where('economic_group_id', group.id);

    if (data.origin) {
      qb.where('origin', data.origin);
    }

    if (data.attribute) {
      qb.whereILike('attribute', data.attribute);
    }

    if (data.replacer) {
      qb.whereILike('replacer', data.replacer);
    }

    return qb;
  }

  async store(unitId: string, data: ITemplateReplacementData) {
    const group = await this.sharedService.getUserGroup(unitId);

    return TemplateReplacement.create({
      economic_group_id: group.id,

      attribute: data.attribute,
      origin: data.origin,
      replacer: data.origin,
    });
  }

  async update(unitId: string, id: string, data: ITemplateReplacementData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const template = await TemplateReplacement.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();

    if (!template) {
      throw this.sharedService.ResourceNotFound();
    }

    return template
      .merge({
        attribute: data.attribute,
        origin: data.origin,
        replacer: data.origin,
      })
      .save();
  }

  async destroy(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const template = await TemplateReplacement.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();

    if (!template) {
      throw this.sharedService.ResourceNotFound();
    }

    return template.delete();
  }
}
