import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import Schedule from 'App/Models/Schedule';
import User from 'App/Models/User';
import { DateTime } from 'luxon';

import TreatmentItem from './TreatmentItem';

const TreatmentExecutionStatus = [
  'Ativo',
  'Confirmado',
  'Cancelado',
  'Excluido',
] as const;
export type TreatmentExecutionStatus = typeof TreatmentExecutionStatus[number];

export default class TreatmentExecution extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({
    columnName: 'scheduled_quantity',
  })
  public scheduledQuantity: number;

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
  public executionDate: DateTime | null;

  @column.dateTime({
    columnName: 'exclusion_date',
  })
  public exclusionDate: DateTime | null;

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

  @belongsTo(() => TreatmentItem, {
    foreignKey: 'treatment_item_id',
  })
  public treatmentItem: BelongsTo<typeof TreatmentItem>;

  @column({
    serializeAs: null,
  })
  public schedule_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'schedule_user_id',
  })
  public scheduleUser: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public schedule_id: string;

  @belongsTo(() => Schedule, {
    foreignKey: 'schedule_id',
  })
  public schedule: BelongsTo<typeof Schedule>;

  @column({
    serializeAs: null,
  })
  public execution_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'execution_user_id',
  })
  public executionUser: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public exclusion_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'exclusion_user_id',
  })
  public exclusionUser: BelongsTo<typeof User>;
}
