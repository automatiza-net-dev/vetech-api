import { inject } from '@adonisjs/fold';
import { ModelObject } from '@ioc:Adonis/Lucid/Orm';
import TemplateReplacement, {
  TemplateReplacementOrigin,
} from 'App/Models/TemplateReplacement';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import ITemplateReplacementData, {
  ITemplateReplacementUser,
} from 'Contracts/interfaces/ITemplateReplacementData';

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

  async replaceUser(unitId: string, data: ITemplateReplacementUser) {
    const group = await this.sharedService.getUserGroup(unitId);

    const user = await User.findOrFail(data.user);

    const templates = await TemplateReplacement.query()
      .where('economic_group_id', group.id)
      .whereIn('origin', [TemplateReplacementOrigin.USERS]);

    const obj = user.toObject();

    return this.parseTemplate(data.base, obj, templates);
  }

  parseTemplate(
    raw: string,
    obj: ModelObject,
    templates: TemplateReplacement[],
  ): string {
    if (templates.length === 0) {
      return raw;
    }

    const [head, ...tail] = templates;

    const value = obj[head.attribute];
    const value$ = value ? this.$toString(value) : 'Valor inválido';

    const updated = raw.replace(head.replacer, value$);

    return this.parseTemplate(updated, obj, tail);
  }

  $toString(data: unknown): string {
    if (typeof data === 'string') {
      return data;
    }

    if (typeof data === 'number' || typeof data === 'bigint') {
      return data.toString();
    }

    if (typeof data === 'boolean') {
      return data ? 'Sim' : 'Não';
    }

    if (data instanceof Date) {
      return data.toDateString();
    }

    return 'Valor inválido';
  }
}
