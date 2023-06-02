import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

export default class Opportunity extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({
    columnName: 'opening_date',
  })
  public openingDate: DateTime;

  @column.dateTime({
    columnName: 'closing_date',
  })
  public closingDate: DateTime;

  @column.dateTime({
    columnName: 'contact_date',
  })
  public contactDate: DateTime;

  @column()
  public description: string;

  @column()
  public observation: string;

  @column({
    columnName: 'result_observation',
  })
  public resultObservation: string;

  @column()
  public value: number;

  @column({
    columnName: 'profit_value',
  })
  public profitValue: number;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public system_id: number;

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
  public closing_user_id: string;

  @column({
    serializeAs: null,
  })
  public user_id: string;

  @column({
    serializeAs: null,
  })
  public client_id: string;

  @column({
    serializeAs: null,
  })
  public client_origin_id: string;

  @column({
    serializeAs: null,
  })
  public contact_id: string;

  @column({
    serializeAs: null,
  })
  public status_id: number;

  @column({
    serializeAs: null,
  })
  public contact_type_id: number;

  @column({
    serializeAs: null,
  })
  public contact_subject_id: number;

  @column({
    serializeAs: null,
  })
  public reason_id: number;
}
