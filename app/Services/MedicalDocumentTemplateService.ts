import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import { RECIPE_UUID } from 'App/Models/TimelineType';
import SharedService from 'App/Services/SharedService';
import IMedicalDocumentTemplateData from 'Contracts/interfaces/IMedicalDocumentTemplateData';

@inject()
export default class MedicalDocumentTemplateService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('medicalDocumentTemplates').query();
  }

  public async show(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const template = await group
      .related('medicalDocumentTemplates')
      .query()
      .where('id', id)
      .first();

    if (!template) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
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
