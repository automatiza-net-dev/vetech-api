import { inject } from '@adonisjs/fold';
import MedicalDocumentTemplate from 'App/Models/MedicalDocumentTemplate';
import { RECIPE_UUID } from 'App/Models/TimelineType';
import SharedService from 'App/Services/SharedService';
import IMedicalDocumentTemplateData from 'Contracts/interfaces/IMedicalDocumentTemplateData';

interface ISearch {
  description?: string;
  title?: string;
}

@inject()
export default class MedicalDocumentTemplateService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = MedicalDocumentTemplate.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null)',
      [group.id],
    );

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.title) {
      qb.where('title', 'ilike', `%${data.title}%`);
    }

    return qb;
  }

  public async show(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const template = await MedicalDocumentTemplate.query()
      .where('id', id)
      .first();

    if (!template) {
      throw this.sharedService.ResourceNotFound();
    }

    if (template.economic_group_id && template.economic_group_id !== group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return template;
  }

  public async store(
    unitId: string,
    data: Omit<IMedicalDocumentTemplateData, 'active'>,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('medicalDocumentTemplates').create({
      timeline_type_id: RECIPE_UUID,
      description: data.description,
      title: data.title,
      header: data.header,
      template: data.template,
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: IMedicalDocumentTemplateData,
  ) {
    const template = await this.show(unitId, id);

    return template
      .merge({
        description: data.description,
        title: data.title,
        header: data.header,
        template: data.template,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const template = await this.show(unitId, id);

    await template.softDelete();
  }
}
