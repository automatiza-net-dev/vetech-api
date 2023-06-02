import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Opportunity from 'App/Models/Opportunity';
import OpportunityActivity from 'App/Models/OpportunityActivity';
import OpportunityLog from 'App/Models/OpportunityLog';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import { DateTime } from 'luxon';

@inject()
export default class OpportunityService {
  constructor(private sharedService: SharedService) {}

  public async store(
    authCtx: AuthContext,
    data: {
      businessUnitId?: string;
      userId: string;
      clientId: string;
      contactId: string;
      statusId: number;
      contactDate: DateTime;
      contactTypeId: number;
      contactSubjectId: number;
      originId: string;
      description: string;
      observation: string;
      value: number;
    },
  ) {
    await Database.transaction(async trx => {
      const model = await Opportunity.create(
        {
          system_id: authCtx.system.id,
          business_unit_id: data.businessUnitId,
          economic_group_id: authCtx.group.id,
          opening_user_id: authCtx.user.id,
          user_id: data.userId,
          client_id: data.clientId,
          contact_id: data.contactId,
          status_id: data.statusId,
          contact_type_id: data.contactTypeId,
          contact_subject_id: data.contactSubjectId,
          client_origin_id: data.originId,

          openingDate: DateTime.now(),
          contactDate: data.contactDate,
          description: data.description,
          observation: data.observation,
          value: data.value,
        },
        {
          client: trx,
        },
      );

      await OpportunityLog.create(
        {
          opportunity_id: model.id,
          economic_group_id: authCtx.group.id,
          business_unit_id: data.businessUnitId,
          opening_user_id: authCtx.user.id,
          openingDate: DateTime.now(),
          status_id: data.statusId,
          user_id: data.userId,
          contact_id: data.contactId,
          value: data.value,
        },
        {
          client: trx,
        },
      );
    });
  }

  public async update(
    authCtx: AuthContext,
    id: number,
    data: {
      businessUnitId?: string;
      userId: string;
      statusId: number;
      contactId: string;
      observation: string;
      value: number;
      active: boolean;
    },
  ) {
    await Database.transaction(async trx => {
      const model = await Opportunity.query()
        .where('economic_group_id', authCtx.group.id)
        .where('id', id)
        .first();

      if (!model) {
        throw this.sharedService.ResourceNotFound();
      }

      await OpportunityLog.create(
        {
          opportunity_id: model.id,
          economic_group_id: authCtx.group.id,
          business_unit_id: model.business_unit_id,
          user_id: model.user_id,
          opening_user_id: model.opening_user_id,
          status_id: model.status_id,
          contact_id: model.contact_id,
          value: model.value,
          openingDate: model.openingDate,
        },
        {
          client: trx,
        },
      );

      await model
        .merge({
          business_unit_id: data.businessUnitId,
          user_id: data.userId,
          status_id: data.statusId,
          contact_id: data.contactId,
          observation: data.observation,
          value: data.value,
          active: data.active,
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async addActivity(
    authCtx: AuthContext,
    data: {
      opportunityId: number;
      userId: string;

      executionDate: DateTime;
      duration: number;
      description: string;
    },
  ) {
    await Database.transaction(async trx => {
      const model = await Opportunity.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('id', data.opportunityId)
        .first();

      if (!model) {
        throw this.sharedService.ResourceNotFound();
      }

      await OpportunityActivity.create(
        {
          opportunity_id: data.opportunityId,
          opening_user_id: authCtx.user.id,
          user_id: data.userId,

          issueDate: DateTime.now(),
          executionDate: data.executionDate,
          duration: data.duration,
          description: data.description,
          status: 'Aberta',
        },
        {
          client: trx,
        },
      );
    });
  }

  public async executeActivity(
    authCtx: AuthContext,
    id: number,
    data: {
      observation: string;
    },
  ) {
    await Database.transaction(async trx => {
      const activity = await OpportunityActivity.query()
        .useTransaction(trx)
        .where('id', id)
        .preload('opportunity')
        .first();

      if (
        !activity ||
        activity.opportunity.economic_group_id !== authCtx.group.id
      ) {
        throw this.sharedService.ResourceNotFound();
      }

      if (activity.status !== 'Aberta') {
        throw new BadRequestException(
          'Atividade já executada ou cancelada',
          400,
          'E_ERR',
        );
      }

      await activity
        .merge({
          execution_user_id: authCtx.user.id,
          executionDate: DateTime.now(),
          observation: data.observation,
          status: 'Executada',
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async cancelActivity(
    authCtx: AuthContext,
    id: number,
    data: {
      observation: string;
    },
  ) {
    await Database.transaction(async trx => {
      const activity = await OpportunityActivity.query()
        .useTransaction(trx)
        .where('id', id)
        .preload('opportunity')
        .first();

      if (
        !activity ||
        activity.opportunity.economic_group_id !== authCtx.group.id
      ) {
        throw this.sharedService.ResourceNotFound();
      }

      if (activity.status !== 'Aberta') {
        throw new BadRequestException(
          'Atividade já executada ou cancelada',
          400,
          'E_ERR',
        );
      }

      await activity
        .merge({
          execution_user_id: authCtx.user.id,
          executionDate: DateTime.now(),
          observation: data.observation,
          status: 'Cancelada',
        })
        .useTransaction(trx)
        .save();
    });
  }
}
