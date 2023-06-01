import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

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
  public status: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public opportunity_id: number;

  @column({
    serializeAs: null,
  })
  public opening_user_id: number;

  @column({
    serializeAs: null,
  })
  public execution_user_id: number;

  @column({
    serializeAs: null,
  })
  public user_id: number;
}
