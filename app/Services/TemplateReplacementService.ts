import { inject } from '@adonisjs/fold';
import { ModelObject } from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import Patient from 'App/Models/Patient';
import Schedule from 'App/Models/Schedule';
import TemplateReplacement, {
  TemplateReplacementOrigin,
} from 'App/Models/TemplateReplacement';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import ITemplateReplacementData, {
  ITemplateReplacementParser,
} from 'Contracts/interfaces/ITemplateReplacementData';

interface ISearch {
  origin?: string;
  attribute?: string;
  replacer?: string;
}

type RenderTextData = Record<TemplateReplacementOrigin, ModelObject | null>;
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
      replacer: data.replacer,
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
        replacer: data.replacer,
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

  async renderText(unitId: string, data: ITemplateReplacementParser) {
    const group = await this.sharedService.getUserGroup(unitId);

    const textData: RenderTextData = {
      BUSINESS: null,
      USER: null,
      SCHEDULE: null,
      TUTOR: null,
      PATIENT: null,
    };

    if (data.businessUnitId) {
      const business = await BusinessUnit.findOrFail(data.businessUnitId);
      textData.BUSINESS = business.toObject();
    }

    if (data.userId) {
      const user = await User.findOrFail(data.userId);
      textData.USER = user.toObject();
    }

    if (data.scheduleId) {
      const schedule = await Schedule.findOrFail(data.scheduleId);
      textData.SCHEDULE = schedule.toObject();
    }

    if (data.tutorId) {
      const tutor = await Patient.findOrFail(data.tutorId);
      textData.TUTOR = tutor.toObject();
    }

    if (data.dependentId) {
      const patient = await Patient.findOrFail(data.dependentId);
      textData.PATIENT = patient.toObject();
    }

    const templates = await TemplateReplacement.query().where(
      'economic_group_id',
      group.id,
    );

    return this.parseTemplate(data.base, textData, templates);
  }

  parseTemplate(
    raw: string,
    data: RenderTextData,
    templates: TemplateReplacement[],
  ): string {
    if (templates.length === 0) {
      return raw;
    }

    const [head, ...tail] = templates;

    const elem = data[head.origin];
    if (!elem) {
      return this.parseTemplate(raw, data, tail);
    }

    const value = elem[head.attribute];
    const value$ = value ? this.$toString(value) : 'Valor inválido';

    const updated = raw.replace(head.replacer, value$);

    return this.parseTemplate(updated, data, tail);
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
