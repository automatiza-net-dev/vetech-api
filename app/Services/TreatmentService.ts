import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Schedule from 'App/Models/Schedule';
import Treatment from 'App/Models/Treatment';
import TreatmentExecution from 'App/Models/TreatmentExecution';
import TreatmentExecutionReschedule from 'App/Models/TreatmentExecutionReschedule';
import TreatmentItem from 'App/Models/TreatmentItem';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import { DateTime } from 'luxon';

@inject()
export default class TreatmentService {
  constructor(private shared: SharedService) {}

  public async create(
    authCtx: AuthContext,
    data: {
      billId?: string;
      clientId: string;
      sellerId: string;

      emissionDate: DateTime;
    },
  ) {
    return Database.transaction(async trx => {
      return Treatment.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,

          bill_id: data.billId,
          emission_user_id: authCtx.user.id,
          client_id: data.clientId,
          seller_id: data.sellerId,

          emissionDate: data.emissionDate,
          status: data.billId ? 'Confirmado' : 'Aberto',
        },
        {
          client: trx,
        },
      );
    });
  }

  public async createItem(
    authCtx: AuthContext,
    data: {
      treatmentId: number;
      kitId?: number;
      productVariationId: string;

      quantity: number;
    },
  ) {
    return Database.transaction(async trx => {
      const existingItem = await TreatmentItem.query()
        .useTransaction(trx)
        .where('treatment_id', data.treatmentId);

      return TreatmentItem.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          kit_id: data.kitId,
          product_variation_id: data.productVariationId,

          id: existingItem.length + 1,
          treatment_id: data.treatmentId,
          quantity: data.quantity,
          quantityExecuted: 0,
          scheduledQuantity: 0,
          status: 'Ativo',
        },
        {
          client: trx,
        },
      );
    });
  }

  public async createExecution(
    authCtx: AuthContext,
    data: {
      treatmentId: number;
      treatmentItemId: number;
      scheduleId: string;

      scheduledQuantity: number;
      scheduleDate: DateTime;
    },
  ) {
    return Database.transaction(async trx => {
      const treatmentItem = await TreatmentItem.query()
        .useTransaction(trx)
        .where('id', data.treatmentItemId)
        .where('treatment_id', data.treatmentId)
        .firstOrFail();

      const existingExecutions = await TreatmentExecution.query()
        .useTransaction(trx)
        .where('treatment_id', data.treatmentId);

      const execution = await TreatmentExecution.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          schedule_id: data.scheduleId,
          schedule_user_id: authCtx.user.id,

          id: existingExecutions.length + 1,
          treatment_id: data.treatmentId,
          treatment_item_id: data.treatmentItemId,

          scheduledQuantity: data.scheduledQuantity,
          quantityExecuted: 0,
          scheduleDate: data.scheduleDate,
          status: 'Ativo',
        },
        {
          client: trx,
        },
      );

      await treatmentItem
        .merge({
          scheduledQuantity:
            treatmentItem.scheduledQuantity + data.scheduledQuantity,
        })
        .useTransaction(trx)
        .save();

      return execution;
    });
  }

  public async batchCreateExecution(
    authCtx: AuthContext,
    data: {
      treatmentId: number;
      treatmentItems: { id: number; quantity: number }[];
      scheduleId: string;
      scheduleDate: DateTime;
    },
  ) {
    return Database.transaction(async trx => {
      const items = await TreatmentItem.query()
        .useTransaction(trx)
        .where('treatment_id', data.treatmentId)
        .whereIn(
          'id',
          data.treatmentItems.map(item => item.id),
        )
        .preload('executions');

      const sum = items.reduce((acc, item) => {
        return acc + item.executions.length;
      }, 0);

      const tasks = items.map(async (item, idx) => {
        const inputItem = data.treatmentItems[idx];

        return item.related('executions').create(
          {
            economic_group_id: authCtx.group.id,
            business_unit_id: authCtx.unit.id,
            schedule_id: data.scheduleId,
            schedule_user_id: authCtx.user.id,

            id: item.executions.length + sum + idx,
            treatment_id: data.treatmentId,
            scheduledQuantity: inputItem.quantity ?? 0,
            quantityExecuted: 0,
            scheduleDate: data.scheduleDate,
            status: 'Ativo',
          },
          { client: trx },
        );
      });

      await Promise.all(tasks);

      const tasks2 = items.map(async (item, idx) => {
        const inputItem = data.treatmentItems[idx];

        return item
          .merge({
            scheduledQuantity: item.scheduledQuantity + inputItem.quantity,
          })
          .useTransaction(trx)
          .save();
      });

      await Promise.all(tasks2);
    });
  }

  public async executeExecution(
    authCtx: AuthContext,
    data: {
      executionId: number;
      treatmentItemId: number;
      treatmentId: number;

      executionDate: DateTime;
      quantity: number;
      observations?: string;
    },
  ) {
    return Database.transaction(async trx => {
      const execution = await TreatmentExecution.query()
        .useTransaction(trx)
        .where('id', data.executionId)
        .where('treatment_id', data.treatmentId)
        .where('treatment_item_id', data.treatmentItemId)
        .preload('treatmentItem')
        .first();

      if (!execution) {
        throw this.shared.ResourceNotFound();
      }

      if (execution.status !== 'Ativo') {
        throw new BadRequestException(
          'Execução já foi finalizada',
          400,
          'E_ERR',
        );
      }

      await execution
        .merge({
          execution_user_id: authCtx.user.id,

          quantityExecuted: data.quantity,
          executionDate: data.executionDate,
          observations: data.observations,
          status: 'Confirmado',
        })
        .useTransaction(trx)
        .save();

      await execution.treatmentItem
        .merge({
          quantityExecuted:
            execution.treatmentItem.quantityExecuted + data.quantity,
          scheduledQuantity:
            execution.treatmentItem.scheduledQuantity -
            (execution.scheduledQuantity - data.quantity),
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async batchExecuteExecution(
    authCtx: AuthContext,
    data: {
      executionList: { id: number; quantity: number; itemId: number }[];
      treatmentId: number;

      executionDate: DateTime;
      observations?: string;
    },
  ) {
    return Database.transaction(async trx => {
      const executions = await TreatmentExecution.query()
        .useTransaction(trx)
        .whereIn(
          'id',
          data.executionList.map(elem => elem.id),
        )
        .where('treatment_id', data.treatmentId)
        .whereIn(
          'treatment_item_id',
          data.executionList.map(e => e.itemId),
        )
        .preload('treatmentItem');

      if (executions.length !== data.executionList.length) {
        throw new BadRequestException(
          'Algumas execuções não foram encontradas',
          400,
          'E_NOT_FOUND',
        );
      }

      if (executions.some(elem => elem.status !== 'Ativo')) {
        throw new BadRequestException(
          'Alguma execução já foi finalizada',
          400,
          'E_ERR',
        );
      }

      const tasks = executions.map(elem => {
        const entry = data.executionList.find(entry => entry.id === elem.id);

        return elem
          .merge({
            execution_user_id: authCtx.user.id,
            executionDate: data.executionDate,
            observations: data.observations,
            quantityExecuted: entry?.quantity ?? 0,
            status: 'Confirmado',
          })
          .useTransaction(trx)
          .save();
      });

      const updatedExecutions = await Promise.all(tasks);

      const updateTasks = updatedExecutions.map(elem => {
        return elem.treatmentItem
          .merge({
            quantityExecuted:
              elem.treatmentItem.quantityExecuted + elem.quantityExecuted,
            scheduledQuantity:
              elem.treatmentItem.scheduledQuantity -
              (elem.scheduledQuantity - elem.quantityExecuted),
          })
          .useTransaction(trx)
          .save();
      });
      await Promise.all(updateTasks);
    });
  }

  public async cancelTreatment(
    authCtx: AuthContext,
    data: {
      treatmentId: number;
      reasonId: string;

      cancellationDate: DateTime;
      cancellationObservations: string;
    },
  ) {
    return Database.transaction(async trx => {
      const execution = await Treatment.findOrFail(data.treatmentId, {
        client: trx,
      });

      if (execution.status === 'Cancelado') {
        throw new BadRequestException(
          'Status inválido de execução',
          400,
          'E_ERR',
        );
      }

      await execution
        .merge({
          cancellation_user_id: authCtx.user.id,
          cancellation_reason_id: data.reasonId,

          cancellationDate: data.cancellationDate,
          cancellationObservations: data.cancellationObservations,
          status: 'Cancelado',
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async searchCompleteTreatments(
    authCtx: AuthContext,
    data: {
      treatment?: string;
    },
  ) {
    if (!data.treatment) {
      throw new BadRequestException('Tratamento não informado', 400, 'E_ERR');
    }

    const treatments = await Treatment.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .where('id', data.treatment)
      .preload('items', query => {
        query.preload('kit');
        query.preload('productVariation', query => {
          query.preload('product');
        });
      })
      .preload('executions', query => {
        query.preload('scheduleUser');
        query.preload('executionUser');
        query.preload('schedule');
      })
      .preload('bill')
      .preload('seller')
      .preload('cancellationUser')
      .preload('cancellationReason')
      .preload('emissionUser')
      .preload('client', query => {
        query.preload('patientAnimal');
      });

    return treatments.map(elem => ({
      id: elem.id,
      bill: elem.bill
        ? {
            id: elem.bill.id,
            tag: elem.bill.tag,
          }
        : null,
      seller: {
        id: elem.seller.id,
        name: elem.seller.name,
      },
      emissionDate: elem.emissionDate,

      cancellationUser: {
        id: elem.cancellationUser?.id ?? null,
        name: elem.cancellationUser?.name ?? null,
      },
      cancellationDate: elem.cancellationDate,

      cancellationReason: {
        id: elem.cancellationReason?.id ?? null,
        reason: elem.cancellationReason?.reason ?? null,
      },
      cancellationObservations: elem.cancellationObservations,

      observations: elem.observations,

      emissionUser: {
        id: elem.emissionUser.id,
        name: elem.emissionUser.name,
      },

      client: {
        id: elem.client.id,
        name: elem.client.name,
        patient: elem.client?.patientAnimal ?? null,
      },
      status: elem.status,

      items: elem.items.map(inner => ({
        id: inner.id,
        kit: {
          id: inner.kit?.id ?? null,
          description: inner.kit?.description ?? null,
        },
        productVariation: {
          id: inner.productVariation.id,
          description: inner.productVariation.product.description,
        },
        quantity: inner.quantity,
        quantityExecuted: inner.quantityExecuted,
        scheduledQuantity: inner.scheduledQuantity,

        observations: inner.observations,
        status: inner.status,
      })),
      executions: elem.executions.map(inner => ({
        id: inner.id,
        item: {
          id: inner.treatment_item_id,
        },
        scheduleUser: {
          id: inner.scheduleUser.id,
          name: inner.scheduleUser.name,
        },
        executionUser: inner.executionUser
          ? {
              id: inner.executionUser.id,
              name: inner.executionUser.name,
            }
          : null,
        scheduleDate: inner.scheduleDate,
        schedule: {
          id: inner.schedule.id,
        },
        executionDate: inner.executionDate,
        quantityExecuted: inner.quantityExecuted,
        scheduledQuantity: inner.scheduledQuantity,
        observations: inner.observations,
        status: inner.status,
        createdAt: inner.createdAt,
      })),
    }));
  }

  public async searchTreatments(
    authCtx: AuthContext,
    data: {
      from?: string;
      to?: string;
      patient?: string;
      tag?: string;
      status?: string;
    },
  ) {
    const qb = Treatment.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .preload('client')
      .preload('seller');

    if (data.from) {
      qb.where('emission_date', '>=', data.from);
    }

    if (data.to) {
      qb.where('emission_date', '<=', data.to);
    }

    if (data.patient) {
      qb.where('client_id', data.patient);
    }

    if (data.tag) {
      qb.whereHas('bill', query => {
        query.where('tag', data.tag ?? '-');
      });
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    const treatments = await qb;
    return treatments.map(elem => ({
      id: elem.id,
      emissionDate: elem.emissionDate,
      seller: {
        id: elem.seller.id,
        name: elem.seller.name,
      },
      client: {
        id: elem.client.id,
        name: elem.client.name,
      },
      status: elem.status,
    }));
  }

  public async searchTreatmentItems(
    authCtx: AuthContext,
    data: {
      treatment?: string;
    },
  ) {
    if (!data.treatment) {
      throw new BadRequestException('Tratamento não informado', 400, 'E_ERR');
    }

    const treatment = await Treatment.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .where('id', data.treatment)
      .preload('items', query => {
        query.preload('kit');
        query.preload('productVariation', query => {
          query.preload('product');
        });
      })
      .first();

    if (!treatment) {
      throw this.shared.ResourceNotFound();
    }

    return treatment.items.map(elem => ({
      id: elem.id,
      kit: {
        id: elem.kit?.id ?? null,
        description: elem.kit?.description ?? null,
      },
      productVariation: {
        id: elem.productVariation.id,
        description: elem.productVariation.product.description,
      },
      quantity: elem.quantity,
      quantityExecuted: elem.quantityExecuted,
      scheduledQuantity: elem.scheduledQuantity,
      observations: elem.observations,
      status: elem.status,
    }));
  }

  public async searchTreatmentExecutions(
    authCtx: AuthContext,
    data: {
      treatment?: string;
    },
  ) {
    if (!data.treatment) {
      throw new BadRequestException('Tratamento não informado', 400, 'E_ERR');
    }

    const treatment = await Treatment.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .where('id', data.treatment)
      .preload('executions', query => {
        query.preload('scheduleUser');
        query.preload('executionUser');
        query.preload('schedule');
      })
      .first();

    if (!treatment) {
      throw this.shared.ResourceNotFound();
    }

    return treatment.executions.map(elem => ({
      id: elem.id,
      item: {
        id: elem.treatment_item_id,
      },
      scheduleUser: {
        id: elem.scheduleUser.id,
        name: elem.scheduleUser.name,
      },
      executionUser: elem.executionUser
        ? {
            id: elem.executionUser.id,
            name: elem.executionUser.name,
          }
        : null,
      scheduleDate: elem.scheduleDate,
      schedule: {
        id: elem.schedule.id,
      },
      executionDate: elem.executionDate,
      quantityExecuted: elem.quantityExecuted,
      scheduledQuantity: elem.scheduledQuantity,
      observations: elem.observations,
      status: elem.status,
      createdAt: elem.createdAt,
    }));
  }

  public async searchClientScheduling(
    authCtx: AuthContext,
    data: {
      client?: string;
      from?: string;
      to?: string;
    },
  ) {
    if (!data.client) {
      throw new BadRequestException('Paciente não informado', 400, 'E_ERR');
    }

    const schedules = await Schedule.query()
      .where('business_unit_id', authCtx.unit.id)
      .where('patient_id', data.client)
      .preload('serviceType')
      .preload('serviceStatus');

    return schedules.map(elem => ({
      id: elem.id,
      startHour: elem.startHour,
      endHour: elem.endHour,
      service: {
        id: elem.serviceType.id,
        description: elem.serviceType.description,
      },
      status: {
        id: elem.serviceStatus.id,
        description: elem.serviceStatus.description,
      },
    }));
  }

  public async searchSomething(
    authCtx: AuthContext,
    data: {
      client: string;
    },
  ) {
    if (!data.client) {
      throw new BadRequestException('Paciente não informado', 400, 'E_ERR');
    }

    const treatments = await Treatment.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .where('client_id', data.client)
      .whereHas('items', query => {
        query.whereRaw(`quantity > scheduled_quantity`);
      })
      .preload('items', query => {
        query.preload('productVariation', query => {
          query.preload('product');
        });
      });

    return treatments.map(elem => ({
      id: elem.id,
      date: elem.emissionDate,
      items: elem.items.map(item => ({
        id: item.id,
        description: item.productVariation.product.description,
        quantity: item.quantity - item.scheduledQuantity,
      })),
    }));
  }

  public async searchDateExecutions(
    authCtx: AuthContext,
    data: {
      date?: string;
      treatment?: number;
    },
  ) {
    const qb = Treatment.query()
      .whereHas('executions', query => {
        query.where('economic_group_id', authCtx.group.id);
        query.where('business_unit_id', authCtx.unit.id);

        query.where('status', 'Ativo');

        if (data.date) {
          const today = DateTime.fromISO(data.date);

          query.whereBetween('schedule_date', [
            today.startOf('day').toJSDate(),
            today.endOf('day').toJSDate(),
          ]);
        }
      })
      .preload('items', query => {
        query.preload('productVariation', query => {
          query.preload('product');
        });
      })
      .preload('executions', query => {
        query.preload('scheduleUser');
        query.preload('schedule');
      })
      .preload('client', query => {
        query.preload('tutors', query => {
          query.preload('tutor');
        });
      });

    if (data.treatment) {
      qb.where('id', data.treatment);
    }

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      emissionDate: elem.emissionDate,
      status: elem.status,
      client: elem.client
        ? {
            id: elem.client.id,
            name: elem.client.name,
            tutorPhone:
              elem.client.tutors.find(t => t.tutor.cellphone)?.tutor
                .cellphone ?? null,
          }
        : null,
      items: elem.items.map(inner => ({
        id: inner.id,
        description: inner.productVariation.product.description,
      })),
      executions: elem.executions.map(inner => ({
        id: inner.id,
        item_id: inner.treatment_item_id,
        quantityExecuted: inner.quantityExecuted,
        scheduledQuantity: inner.scheduledQuantity,
        status: inner.status,

        scheduleUser: {
          id: inner.scheduleUser.id,
          name: inner.scheduleUser.name,
        },

        scheduling: inner.schedule
          ? {
              id: inner.schedule.id,
              date: inner.schedule.startHour,
            }
          : null,
      })),
    }));
  }

  public async updateTreatmentExecution(
    authCtx: AuthContext,
    data: {
      treatmentExecutionId: number;
      reasonId: string;
      scheduleId: string;

      observations: string;
    },
  ) {
    await Database.transaction(async trx => {
      const treatmentExecution = await TreatmentExecution.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.treatmentExecutionId)
        .first();

      if (!treatmentExecution) {
        throw this.shared.ResourceNotFound();
      }

      const reschedules = await TreatmentExecutionReschedule.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('treatment_id', treatmentExecution.treatment_id)
        .where('treatment_item_id', treatmentExecution.treatment_item_id);

      await TreatmentExecutionReschedule.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          treatment_id: treatmentExecution.treatment_id,
          treatment_item_id: treatmentExecution.treatment_item_id,
          treatment_item_execution_id: treatmentExecution.id,
          id: reschedules.length + 1,

          reschedule_user_id: authCtx.user.id,
          rescheduleDate: DateTime.now(),
          reason_id: data.reasonId,
          observations: data.observations,
          schedule_user_id: treatmentExecution.schedule_user_id,
          scheduleDate: treatmentExecution.scheduleDate,
          evaluationId: treatmentExecution.schedule_id,
        },
        { client: trx },
      );

      await treatmentExecution
        .merge({
          schedule_user_id: authCtx.user.id,
          scheduleDate: DateTime.now(),
          schedule_id: data.scheduleId,
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async cancelTreatmentExecution(
    authCtx: AuthContext,
    data: {
      treatmentId: number;
      treatmentExecutionId: number;

      reason: string;
    },
  ) {
    await Database.transaction(async trx => {
      const execution = await TreatmentExecution.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.treatmentExecutionId)
        .where('treatment_id', data.treatmentId)
        .preload('treatmentItem')
        .first();

      if (!execution) {
        throw this.shared.ResourceNotFound();
      }

      if (execution.status !== 'Ativo') {
        throw new BadRequestException('Execução já finalizada', 400, 'E_ERR');
      }

      await execution
        .merge({
          status: 'Cancelado',
          exclusion_user_id: authCtx.user.id,
          exclusionDate: DateTime.now(),
          observations: data.reason,
        })
        .useTransaction(trx)
        .save();

      await execution.treatmentItem
        .merge({
          scheduledQuantity:
            execution.treatmentItem.quantityExecuted +
            execution.scheduledQuantity,
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async excludeTreatmentExecution(
    authCtx: AuthContext,
    data: {
      treatmentId: number;
      treatmentExecutionId: number;

      reason: string;
    },
  ) {
    await Database.transaction(async trx => {
      const execution = await TreatmentExecution.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.treatmentExecutionId)
        .where('treatment_id', data.treatmentId)
        .preload('treatmentItem')
        .first();

      if (!execution) {
        throw this.shared.ResourceNotFound();
      }

      if (execution.status !== 'Ativo') {
        throw new BadRequestException('Execução já finalizada', 400, 'E_ERR');
      }

      await execution
        .merge({
          status: 'Excluido',
          observations: data.reason,
          exclusion_user_id: authCtx.user.id,
          exclusionDate: DateTime.now(),
        })
        .useTransaction(trx)
        .save();

      await execution.treatmentItem
        .merge({
          scheduledQuantity:
            execution.treatmentItem.scheduledQuantity -
            execution.scheduledQuantity,
        })
        .useTransaction(trx)
        .save();
    });
  }
}
