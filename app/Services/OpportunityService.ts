import { inject } from '@adonisjs/fold';
import Database, {
  QueryClientContract,
  TransactionClientContract,
} from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import CrmStatus from 'App/Models/CrmStatus';
import Opportunity from 'App/Models/Opportunity';
import OpportunityActivity from 'App/Models/OpportunityActivity';
import OpportunityLog from 'App/Models/OpportunityLog';
import Schedule from 'App/Models/Schedule';
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
      .preload('contactType')
      .preload('contactSubject')
      .preload('clientOrigin')
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
      description: result.description,
      observation: result.observation,

      status: result.status,
      contact: result.contact,
      contactType: result.contactType,
      contactSubject: result.contactSubject,
      client: result.client,
      clientOrigin: result.clientOrigin,

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
      balance?: string;
    },
  ) {
    const qb = Opportunity.query()
      .where('economic_group_id', authCtx.group.id)
      .preload('client', query => {
        query.preload('tutor');
      })
      .preload('contact')
      .preload('contactType')
      .preload('contactSubject')
      .preload('status')
      .preload('user')
      .preload('unit')
      .preload('clientOrigin');

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

    if (data.balance) {
      if (data.balance === 'Em Aberto') {
        qb.whereNull('closing_date');
      } else {
        qb.where('balance', data.balance);
      }
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
      description: elem.description,
      observation: elem.observation,

      status: elem.status,
      contact: elem.contact,
      contactType: elem.contactType,
      contactSubject: elem.contactSubject,
      client: elem.client,
      clientOrigin: elem.clientOrigin,

      user: {
        id: elem.user.id,
        name: elem.user.name,
      },
      unit: {
        id: elem.unit.id,
        companyName: elem.unit.companyName,
        fantasyName: elem.unit.fantasyName,
      },
      schedule: {
        id: elem.schedule_id ?? null,
      },
    }));
  }

  public async searchActivities(
    authCtx: AuthContext,
    data: {
      fromDate?: string;
      toDate?: string;
      description?: string;
      contactName?: string;
      patientName?: string;
      technicianName?: string;
      status?: string;
    },
  ) {
    const qb = OpportunityActivity.query()
      .preload('activity')
      .preload('opportunity', query => {
        query.preload('client').preload('contact').preload('user');
      })
      .preload('executionUser')
      .whereHas('opportunity', query => {
        query.where('economic_group_id', authCtx.group.id);
      });

    if (data.fromDate) {
      qb.where('execution_date', '>=', data.fromDate);
    }

    if (data.toDate) {
      qb.where('execution_date', '<=', data.toDate);
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    if (data.technicianName) {
      qb.whereHas('user', query => {
        query.whereILike('name', `%${data.technicianName!}%`);
      });
    }

    if (data.description) {
      qb.whereHas('activity', query => {
        query.whereILike('description', `%${data.description!}%`);
      });
    }

    if (data.patientName || data.contactName) {
      qb.whereHas('opportunity', query => {
        if (data.patientName) {
          query.whereHas('client', query => {
            query.whereILike('name', `%${data.patientName!}%`);
          });
        }

        if (data.contactName) {
          query.whereHas('contact', query => {
            query.whereILike('name', `%${data.contactName!}%`);
          });
        }
      });
    }

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      issueDate: elem.issueDate,
      duration: elem.duration,
      executionDate: elem.executionDate,
      executedDate: elem.executedDate,
      description: elem.description,
      observation: elem.observation,
      status: elem.status,

      activity: {
        id: elem.activity.id,
        description: elem.activity.description,
      },
      client: elem.opportunity?.client
        ? {
            id: elem.opportunity?.client.id,
            name: elem.opportunity?.client.name,
          }
        : null,
      contact: elem.opportunity?.contact
        ? {
            id: elem.opportunity?.contact.id,
            name: elem.opportunity?.contact.name,
          }
        : null,
      user: elem.opportunity.user
        ? {
            id: elem.opportunity.user.id,
            name: elem.opportunity.user.name,
          }
        : null,
      executionUser: elem.executionUser
        ? {
            id: elem.executionUser.id,
            name: elem.executionUser.name,
          }
        : null,
    }));
  }

  public async searchKanbanOpportunities(
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
      status?: string;
      unit?: string;
    },
  ) {
    const qb = Opportunity.query()
      .where('economic_group_id', authCtx.group.id)
      .whereNull('closing_date')
      .preload('client', query => {
        query.preload('tutor');
      })
      .preload('contact')
      .preload('contactType')
      .preload('contactSubject')
      .preload('clientOrigin')
      .preload('status')
      .preload('user')
      .preload('unit')
      .preload('activities', query => {
        query.where('status', 'Aberta');

        query.preload('executionUser');
        query.preload('activity');
        query.preload('openingUser');
      });

    if (data.technician) {
      qb.where('user_id', data.technician);
    }

    if (data.unit) {
      qb.where('business_unit_id', data.unit);
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

    if (data.contactPhone) {
      qb.whereHas('contact', query => {
        if (data.contactPhone) {
          query.whereHas('tutor', query => {
            query.where('cellphone', 'ilike', `%${data.contactPhone}%`);
          });
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
        description: op.description,
        observation: op.observation,

        status: op.status,
        contact: op.contact,
        contactDate: op.contactDate,
        contactType: op.contactType,
        contactSubject: op.contactSubject,
        client: op.client,
        clientOrigin: op.clientOrigin,
        user: {
          id: op.user.id,
          name: op.user.name,
        },
        unit: {
          id: op.unit.id,
          companyName: op.unit.companyName,
          fantasyName: op.unit.fantasyName,
        },
        schedule: {
          id: op.schedule_id ?? null,
        },

        activities: op.activities.map(elem => ({
          id: elem.id,
          description: elem.description,
          executionDate: elem.executionDate,
          duration: elem.duration,
          status: elem.status,
          activity: elem.activity,
          user: this.sharedService.captureGroup(elem.openingUser, v => ({
            id: v.id,
            name: v.name,
          })),
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
          status_id: data.statusId,
          user_id: data.userId,
          contact_id: data.contactId,
          schedule_id: model.schedule_id,

          value: data.value,
          openingDate: DateTime.now(),
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
      clientId: string;
      contactTypeId: number;
      contactSubjectId: number;

      contactDate: DateTime;
      description: string;
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

      const result = await model
        .merge({
          user_id: data.userId,
          client_id: data.clientId,
          contact_id: data.contactId,
          status_id: data.statusId,
          contact_type_id: data.contactTypeId,
          contact_subject_id: data.contactSubjectId,

          contactDate: data.contactDate,
          description: data.description,
          observation: data.observation,
          value: data.value,
          active: data.active,
        })
        .useTransaction(trx)
        .save();

      await this.createLog(result, trx);
    });
  }

  public async closeWinningOpportunity(
    authCtx: AuthContext,
    id: number,
    data: {
      reasonId: string;
      value: number;
      observation?: string;
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

      await model
        .merge({
          reason_id: data.reasonId,
          closing_user_id: authCtx.user.id,

          closingDate: DateTime.now(),
          balance: 'Ganho',
          resultObservation: data.observation,
          profitValue: data.value,
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async closeLoosingOpportunity(
    authCtx: AuthContext,
    id: number,
    data: {
      reasonId: string;
      observation?: string;
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

      await model
        .merge({
          reason_id: data.reasonId,
          closing_user_id: authCtx.user.id,

          closingDate: DateTime.now(),
          balance: 'Perda',
          resultObservation: data.observation,
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async reopenOpportunity(authCtx: AuthContext, id: number) {
    await Database.transaction(async trx => {
      const model = await Opportunity.query()
        .where('economic_group_id', authCtx.group.id)
        .where('id', id)
        .first();

      if (!model) {
        throw this.sharedService.ResourceNotFound();
      }

      await this.createLog(model, trx);

      await model
        .merge({
          reason_id: undefined,
          closing_user_id: undefined,

          closingDate: undefined,
          balance: undefined,
          resultObservation: undefined,
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async updateStatus(
    authCtx: AuthContext,
    id: number,
    data: {
      statusId: number;
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

      const result = await model
        .merge({
          status_id: data.statusId,
        })
        .useTransaction(trx)
        .save();

      await this.createLog(result, trx);
    });
  }

  public async updateUser(
    authCtx: AuthContext,
    id: number,
    data: {
      userId: string;
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

      const result = await model
        .merge({
          user_id: data.userId,
        })
        .useTransaction(trx)
        .save();

      await this.createLog(result, trx);
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

  public async updateActivity(
    authCtx: AuthContext,
    data: {
      id: number;
      userId: string;
      activityId: number;

      executionDate: DateTime;
      duration: number;
      description?: string;
    },
  ) {
    await Database.transaction(async trx => {
      const model = await OpportunityActivity.query()
        .useTransaction(trx)
        .where('id', data.id)
        .whereHas('opportunity', query => {
          query.where('economic_group_id', authCtx.group.id);
        })
        .first();

      if (!model) {
        throw this.sharedService.ResourceNotFound();
      }

      await model
        .merge({
          opening_user_id: authCtx.user.id,
          user_id: data.userId,
          activity_id: data.activityId,

          executionDate: data.executionDate,
          duration: data.duration,
          description: data.description,
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async executeActivity(
    authCtx: AuthContext,
    id: number,
    data: {
      observation?: string;
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
          executedDate: DateTime.now(),
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

  public async excludeActivity(authCtx: AuthContext, id: number) {
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
          'Atividade já executada, cancelada ou excluída',
          400,
          'E_ERR',
        );
      }

      await activity
        .merge({
          exclusion_user_id: authCtx.user.id,
          deletedAt: DateTime.now(),
          status: 'Excluida',
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async syncSchedules(
    authCtx: AuthContext,
    data: {
      scheduleId: string;
    },
  ) {
    await Database.transaction(async trx => {
      const schedule = await Schedule.query()
        .useTransaction(trx)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.scheduleId)
        .first();

      if (!schedule) {
        throw this.sharedService.ResourceNotFound('Agendamento não encontrado');
      }

      if (schedule.opportunity_id) {
        throw new BadRequestException(
          'Agendamento já contem oportunidade',
          400,
          'E_ERR',
        );
      }

      if (!schedule.patient_id) {
        throw new BadRequestException(
          'Agendamento não possui paciente',
          400,
          'E_ERR',
        );
      }

      const model = await Opportunity.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('patient_id', schedule.patient_id)
        .whereNull('schedule_id')
        .whereNull('closing_date')
        .first();
      if (!model) {
        throw this.sharedService.ResourceNotFound(
          'Oportunidade não encontrada',
        );
      }

      const status = await CrmStatus.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('type', 'OP')
        .where('tag', 'A')
        .where('active', true)
        .first();
      if (!status) {
        throw this.sharedService.ResourceNotFound('Status não encontrado');
      }

      const result = await model
        .merge({
          schedule_id: schedule.id,
          status_id: status.id,
        })
        .useTransaction(trx)
        .save();

      await schedule
        .merge({
          opportunity_id: model.id,
        })
        .useTransaction(trx)
        .save();

      await this.createLog(result, trx);
    });
  }

  public async updateOpportunityScheduleAsAttended(
    authCtx: AuthContext,
    schedule: Schedule,
    trx: TransactionClientContract,
  ) {
    if (!schedule.opportunity_id) {
      return;
    }

    const model = await Opportunity.query()
      .where('business_unit_id', schedule.business_unit_id)
      .where('id', schedule.opportunity_id)
      .first();
    if (!model) {
      return;
    }

    const status = await CrmStatus.query()
      .useTransaction(trx)
      .where('economic_group_id', authCtx.group.id)
      .where('type', 'OP')
      .where('tag', 'C')
      .where('active', true)
      .first();
    if (!status) {
      return;
    }

    await model
      .merge({
        status_id: status.id,
      })
      .useTransaction(trx)
      .save();

    await this.createLog(model, trx);
  }

  public async updateOpportunityScheduleAsUnchecked(
    authCtx: AuthContext,
    schedule: Schedule,
    trx: TransactionClientContract,
  ) {
    if (!schedule.opportunity_id) {
      return;
    }

    const model = await Opportunity.query()
      .where('business_unit_id', schedule.business_unit_id)
      .where('id', schedule.opportunity_id)
      .first();
    if (!model) {
      return;
    }

    const status = await CrmStatus.query()
      .useTransaction(trx)
      .where('economic_group_id', authCtx.group.id)
      .where('type', 'OP')
      .where('tag', 'D')
      .where('active', true)
      .first();
    if (!status) {
      return;
    }

    await model
      .merge({
        status_id: status.id,
      })
      .useTransaction(trx)
      .save();

    await this.createLog(model, trx);
  }

  private async createLog(model: Opportunity, client?: QueryClientContract) {
    await OpportunityLog.create(
      {
        opportunity_id: model.id,

        economic_group_id: model.economic_group_id,
        business_unit_id: model.business_unit_id,
        user_id: model.user_id,
        client_id: model.client_id,
        contact_subject_id: model.contact_subject_id,
        contact_type_id: model.contact_type_id,
        status_id: model.status_id,
        contact_id: model.contact_id,
        schedule_id: model.schedule_id,

        balance: model.balance,
        description: model.description,
        observation: model.observation,
        reason_id: model.reason_id,
        profitValue: model.profitValue,
        resultObservation: model.resultObservation,
        value: model.value,
        contactDate: model.contactDate,
        openingDate: model.openingDate,
        closingDate: model.closingDate,
      },
      {
        client,
      },
    );
  }
}
