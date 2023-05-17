import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

const TreatmentExecutionStatus = ['Ativo', 'Confirmado', 'Cancelado'] as const;
export type TreatmentExecutionStatus = typeof TreatmentExecutionStatus[number];

export default class TreatmentExecution extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({
    columnName: 'quantity_executed',
  })
  public quantityExecuted: number;

  @column.dateTime({
    columnName: 'schedule_date',
  })
  public scheduleDate: DateTime;

  @column.dateTime({
    columnName: 'execution_date',
  })
  public executionDate: DateTime;

  @column()
  public observations: string;

  @column()
  public status: TreatmentExecutionStatus;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public economic_group_id: string;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @column({
    serializeAs: null,
  })
  public treatment_id: number;

  @column({
    serializeAs: null,
  })
  public treatment_item_id: number;

  @column({
    serializeAs: null,
  })
  public schedule_user_id: string;

  @column({
    serializeAs: null,
  })
  public schedule_id: string;

  @column({
    serializeAs: null,
  })
  public execution_user_id: string;
}
