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

  public async showOpportunity(authCtx: AuthContext, id: string) {
    const result = await Opportunity.query()
      .where('economic_group_id', authCtx.group.id)
      .where('id', id)
      .preload('client', query => {
        query.preload('tutor');
      })
      .preload('contact')
      .preload('status')
      .preload('user')
      .preload('unit')
      .preload('activities', query => {
        query.preload('openingUser');
        query.preload('executionUser');
        query.preload('activity');
      })
      .first();

    if (!result) {
      throw this.sharedService.ResourceNotFound();
    }

    return {
      id: result.id,
      openingDate: result.openingDate,
      contactDate: result.contactDate,
      value: result.value,
      status: result.status,
      contact: result.contact,
      client: result.client,
      user: {
        id: result.user.id,
        name: result.user.name,
      },
      unit: {
        id: result.unit.id,
        companyName: result.unit.companyName,
        fantasyName: result.unit.fantasyName,
      },
      activities: result.activities,
    };
  }

  public async searchOpportunities(
    authCtx: AuthContext,
    data: {
      openingFrom?: string;
      openingTo?: string;
      contactFrom?: string;
      contactTo?: string;
      contactName?: string;
      contactPhone?: string;
      patientName?: string;
      technician?: string;
      unit?: string;
      status?: string;
    },
  ) {
    const qb = Opportunity.query()
      .where('economic_group_id', authCtx.group.id)
      .preload('client', query => {
        query.preload('tutor');
      })
      .preload('contact')
      .preload('status')
      .preload('user')
      .preload('unit');

    if (data.unit) {
      qb.where('business_unit_id', data.unit);
    }

    if (data.technician) {
      qb.where('user_id', data.technician);
    }

    if (data.openingFrom) {
      qb.where('opening_date', '>=', data.openingFrom);
    }

    if (data.openingTo) {
      qb.where('opening_date', '<=', data.openingTo);
    }

    if (data.contactFrom) {
      qb.where('contact_date', '>=', data.contactFrom);
    }

    if (data.contactTo) {
      qb.where('contact_date', '<=', data.contactTo);
    }

    if (data.status) {
      qb.where('status_id', data.status);
    }

    if (data.contactName || data.contactPhone) {
      qb.whereHas('contact', query => {
        if (data.contactName) {
          query.where('name', 'ilike', `%${data.contactName}%`);
        }

        if (data.contactPhone) {
          query.whereHas('tutor', query => {
            query.where('cellphone', 'ilike', `%${data.contactPhone}%`);
          });
        }
      });
    }

    if (data.patientName) {
      qb.whereHas('client', query => {
        if (data.patientName) {
          query.where('name', 'ilike', `%${data.patientName}%`);
        }
      });
    }

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      openingDate: elem.openingDate,
      contactDate: elem.contactDate,
      value: elem.value,
      status: elem.status,
      contact: elem.contact,
      client: elem.client,
      user: {
        id: elem.user.id,
        name: elem.user.name,
      },
      unit: {
        id: elem.unit.id,
        companyName: elem.unit.companyName,
        fantasyName: elem.unit.fantasyName,
      },
    }));
  }

  public async searchKanbanOpportunities(
    authCtx: AuthContext,
    data: {
      openingFrom?: string;
      openingTo?: string;
      contactName?: string;
      patientName?: string;
      technician?: string;
      status?: string;
    },
  ) {
    const qb = Opportunity.query()
      .where('economic_group_id', authCtx.group.id)
      .preload('client')
      .preload('contact')
      .preload('status')
      .preload('user')
      .preload('unit')
      .preload('activities', query => {
        query.where('status', 'Aberta');
      });

    if (data.technician) {
      qb.where('user_id', data.technician);
    }

    if (data.openingFrom) {
      qb.where('opening_date', '>=', data.openingFrom);
    }

    if (data.openingTo) {
      qb.where('opening_date', '<=', data.openingTo);
    }

    if (data.contactName) {
      qb.whereHas('contact', query => {
        if (data.contactName) {
          query.where('name', 'ilike', `%${data.contactName}%`);
        }
      });
    }

    if (data.patientName) {
      qb.whereHas('client', query => {
        if (data.patientName) {
          query.where('name', 'ilike', `%${data.patientName}%`);
        }
      });
    }

    const result = await qb;

    const statusMap = new Map();
    // eslint-disable-next-line
    for (const op of result) {
      if (!statusMap.has(op.status.description)) {
        statusMap.set(op.status.description, []);
      }

      statusMap.get(op.status.description).push({
        id: op.id,
        openingDate: op.openingDate,
        value: op.value,
        contact: {
          id: op.contact.id,
          name: op.contact.name,
        },
        client: {
          id: op.client.id,
          name: op.client.name,
        },
        user: {
          id: op.user.id,
          name: op.user.name,
        },
        unit: {
          id: op.unit.id,
          companyName: op.unit.companyName,
          fantasyName: op.unit.fantasyName,
        },
        activities: op.activities.map(elem => ({
          id: elem.id,
          description: elem.description,
          executionDate: elem.executionDate,
          duration: elem.duration,
          status: elem.status,
        })),
      });
      // statusMap.set(op.status.description, updatedData);
    }

    const mappedResult: Record<string, unknown> = {};
    // eslint-disable-next-line
    for (const [key, value] of statusMap.entries()) {
      mappedResult[key] = value;
    }

    return mappedResult;
  }

  public async searchKanbanOpportunityActivities(
    authCtx: AuthContext,
    data: {
      activity?: string;
      opportunity?: string;
    },
  ) {
    const qb = OpportunityActivity.query()
      .whereHas('activity', query => {
        query.where('economic_group_id', authCtx.group.id);
      })
      .preload('executionUser')
      .preload('openingUser')
      .preload('activity');
    // .preload('opportunity', query => {
    //   query
    //     .preload('client')
    //     .preload('contact')
    //     .preload('status')
    //     .preload('user')
    //     .preload('unit');
    // });

    if (data.activity) {
      qb.where('activity_id', data.activity);
    }

    if (data.opportunity) {
      qb.where('opportunity_id', data.opportunity);
    }

    return qb;
  }

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
      observation?: string;
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
      observation?: string;
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
      activityId: number;

      executionDate: DateTime;
      duration: number;
      description?: string;
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
          activity_id: data.activityId,

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
        .whereHas('opportunity', query => {
          query.where('economic_group_id', authCtx.group.id);
        })
        .first();

      if (!activity) {
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
        .whereHas('opportunity', query => {
          query.where('economic_group_id', authCtx.group.id);
        })
        .first();

      if (!activity) {
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
