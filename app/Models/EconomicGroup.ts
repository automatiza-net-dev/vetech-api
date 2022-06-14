import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

export default class EconomicGroup extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column({
    columnName: 'fantasy_name',
  })
  public fantasyName: string;

  @column({
    columnName: 'company_name',
  })
  public companyName: string;

  @column({})
  public document: string;

  @column({
    columnName: 'responsible_email',
  })
  public responsibleEmail: string;

  @column({
    columnName: 'responsible_phone',
  })
  public responsiblePhone: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}
