import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

export default class Treatment extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({
    columnName: 'cancellation_date',
  })
  public cancellationDate: DateTime | null;

  @column()
  public observations: string;

  @column({
    columnName: 'cancellation_observations',
  })
  public cancellationObservations: string | null;

  @column()
  public status: string;

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
  public bill_id: string;

  @column({
    serializeAs: null,
  })
  public emission_user_id: string;

  @column({
    serializeAs: null,
  })
  public cancellation_user_id: string;

  @column({
    serializeAs: null,
  })
  public cancellation_reason_id: string;

  @column({
    serializeAs: null,
  })
  public seller_id: string;

  @column({
    serializeAs: null,
  })
  public client_id: string;
}
