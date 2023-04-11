import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import MedicalDocumentTemplate from 'App/Models/MedicalDocumentTemplate';
import { RECIPE_UUID } from 'App/Models/TimelineType';
import { AuthContext } from 'App/Services/SharedService';
import IMedicalDocumentTemplateData from 'Contracts/interfaces/IMedicalDocumentTemplateData';

interface ISearch {
  description?: string;
  title?: string;
}

@inject()
export default class MedicalDocumentTemplateService {
  public async index(authCtx: AuthContext, data: ISearch) {
    const qb = MedicalDocumentTemplate.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null)',
      [authCtx.group.id],
    );

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.title) {
      qb.where('title', 'ilike', `%${data.title}%`);
    }

    return qb;
  }

  public async show(authCtx: AuthContext, id: string) {
    const template = await authCtx.group
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
    authCtx: AuthContext,
    data: Omit<IMedicalDocumentTemplateData, 'active'>,
  ) {
    return authCtx.group.related('medicalDocumentTemplates').create({
      timeline_type_id: RECIPE_UUID,
      description: data.description,
      title: data.title,
      header: data.header,
      template: data.template,
    });
  }

  public async update(
    authCtx: AuthContext,
    id: string,
    data: IMedicalDocumentTemplateData,
  ) {
    const template = await this.show(authCtx, id);

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

  public async destroy(authCtx: AuthContext, id: string) {
    const template = await this.show(authCtx, id);

    await template.softDelete();
  }
}
