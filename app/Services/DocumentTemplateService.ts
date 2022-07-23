import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import { DOCUMENT_UUID } from 'App/Models/TimelineType';
import SharedService from 'App/Services/SharedService';
import IDocumentTemplateData from 'Contracts/interfaces/IDocumentTemplateData';

@inject()
export default class DocumentTemplateService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('documentTemplates').query();
  }

  public async show(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const template = await group
      .related('documentTemplates')
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
    data: Omit<IDocumentTemplateData, 'active'>,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('documentTemplates').create({
      timeline_type_id: DOCUMENT_UUID,
      description: data.description,
      title: data.title,
      header: data.header,
      template: data.template,
    });
  }

  public async update(unitId: string, id: string, data: IDocumentTemplateData) {
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

  public async template(unitId: string, id: string) {
    const template = await this.show(unitId, id);

    await template.softDelete();
  }
}
