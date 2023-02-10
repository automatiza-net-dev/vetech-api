import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

export default class BusinessUnitConfig extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @column({
    serializeAs: null,
  })
  public sale_exit_account_plan_id: string;

  @column({
    serializeAs: null,
  })
  public other_exit_account_plan_id: string;

  @column({
    serializeAs: null,
  })
  public order_entry_account_plan_id: string;

  @column({
    serializeAs: null,
  })
  public other_entry_account_plan_id: string;
}
