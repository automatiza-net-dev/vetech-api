import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import Activity from 'App/Models/Activity';
import User from 'App/Models/User';
import { DateTime } from 'luxon';

import Opportunity from './Opportunity';

export const OpportunityActivityStatus = [
  'Aberta',
  'Executada',
  'Cancelada',
] as const;

export default class OpportunityActivity extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({
    columnName: 'issue_date',
  })
  public issueDate: DateTime;

  @column.dateTime({
    columnName: 'executed_date',
  })
  public executedDate: DateTime;

  @column.dateTime({
    columnName: 'execution_date',
  })
  public executionDate: DateTime;

  @column()
  public duration: number;

  @column()
  public description: string;

  @column()
  public observation: string;

  @column()
  public status: typeof OpportunityActivityStatus[number];

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public opportunity_id: number;

  @belongsTo(() => Opportunity, {
    foreignKey: 'opportunity_id',
  })
  public opportunity: BelongsTo<typeof Opportunity>;

  @column({
    serializeAs: null,
  })
  public opening_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'opening_user_id',
  })
  public openingUser: BelongsTo<typeof User>;

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
  public user_id: string;

  @column({
    serializeAs: null,
  })
  public activity_id: number;

  @belongsTo(() => Activity, {
    foreignKey: 'activity_id',
  })
  public activity: BelongsTo<typeof Activity>;
}
