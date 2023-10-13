import { inject } from '@adonisjs/fold';
import MedicalDocumentTemplate from 'App/Models/MedicalDocumentTemplate';
import TimelineType from 'App/Models/TimelineType';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IMedicalDocumentTemplateData from 'Contracts/interfaces/IMedicalDocumentTemplateData';

interface ISearch {
  description?: string;
  title?: string;
}

@inject()
export default class MedicalDocumentTemplateService {
  constructor(private sharedService: SharedService) {}

  public async index(authCtx: AuthContext, data: ISearch) {
    const qb = MedicalDocumentTemplate.query()
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
    const template = await MedicalDocumentTemplate.query()
      .where('id', id)
      .first();

    if (!template) {
      throw this.sharedService.ResourceNotFound();
    }

    if (
      template.economic_group_id &&
      template.economic_group_id !== authCtx.group.id
    ) {
      throw this.sharedService.ResourceNotFound();
    }

    return template;
  }

  public async store(
    authCtx: AuthContext,
    data: Omit<IMedicalDocumentTemplateData, 'active'>,
  ) {
    const timeline = await TimelineType.firstOrCreate(
      {
        description: 'Formato Receita Médica',
        system_id: authCtx.system.id,
      },
      {
        description: 'Formato Receita Médica',
        color: '#000',
        requiresObservation: false,
        system_id: authCtx.system.id,
      },
    );

    return authCtx.group.related('medicalDocumentTemplates').create({
      timeline_type_id: timeline.id,
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
