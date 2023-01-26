import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

export enum AccountPlanGroupType {
  C = 'CREDITO',
  D = 'DEBITO',
  A = 'AMBOS',
}

export default class AccountPlanGroup extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public description: string;

  @column()
  public type: AccountPlanGroupType;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public economic_group_id: string;
}
