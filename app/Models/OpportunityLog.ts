import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

export default class OpportunityLog extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({
    columnName: 'opening_date',
  })
  public openingDate: DateTime;

  @column()
  public value: number;

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
  public economic_group_id: string;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @column({
    serializeAs: null,
  })
  public opening_user_id: string;

  @column({
    serializeAs: null,
  })
  public user_id: string;

  @column({
    serializeAs: null,
  })
  public contact_id: string;

  @column({
    serializeAs: null,
  })
  public status_id: number;
}
