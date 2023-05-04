import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import DocumentTemplate from 'App/Models/DocumentTemplate';
import { DOCUMENT_UUID } from 'App/Models/TimelineType';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IDocumentTemplateData from 'Contracts/interfaces/IDocumentTemplateData';

interface ISearch {
  description?: string;
  title?: string;
}

@inject()
export default class DocumentTemplateService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(authCtx: AuthContext, data: ISearch) {
    const qb = DocumentTemplate.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id);

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.title) {
      qb.where('title', 'ilike', `%${data.title}%`);
    }

    return qb;
  }

  public async show(authCtx: AuthContext, id: string) {
    const template = await DocumentTemplate.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id)
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
    data: Omit<IDocumentTemplateData, 'active'>,
  ) {
    return authCtx.group.related('documentTemplates').create({
      timeline_type_id: DOCUMENT_UUID,
      description: data.description,
      title: data.title,
      header: data.header,
      template: data.template,
      system_id: authCtx.system.id,
    });
  }

  public async update(
    authCtx: AuthContext,
    id: string,
    data: IDocumentTemplateData,
  ) {
    const template = await this.show(authCtx, id);

    if (!template.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

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

    if (!template.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    await template.softDelete();
  }
}
