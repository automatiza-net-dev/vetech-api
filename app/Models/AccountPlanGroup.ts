import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm';
import AccountPlan from 'App/Models/AccountPlan';
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
  public system_id: number;

  @column({
    serializeAs: null,
  })
  public economic_group_id: string;

  @hasMany(() => AccountPlan, {
    foreignKey: 'account_plan_group_id',
  })
  public accountPlans: HasMany<typeof AccountPlan>;
}
