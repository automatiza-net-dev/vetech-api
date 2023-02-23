import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import AccountPlanGroup from 'App/Models/AccountPlanGroup';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum AccountPlanType {
  'C' = 'CREDITO',
  'D' = 'DEBITO',
}

export default class AccountPlan extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public description: string;

  @column()
  public code: string;

  @column()
  public type: AccountPlanType;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime;

  @beforeFind()
  public static softDeletesFind = softDeleteQuery;

  @beforeFetch()
  public static softDeletesFetch = softDeleteQuery;

  public async softDelete(column?: string) {
    await softDelete(this, column);
  }

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
  public parent_id: string;

  @belongsTo(() => AccountPlan, {
    localKey: 'id',
    foreignKey: 'parent_id',
  })
  // eslint-disable-next-line no-use-before-define
  public parent: BelongsTo<typeof AccountPlan>;

  @column({
    serializeAs: null,
  })
  public account_plan_group_id: number;

  @belongsTo(() => AccountPlanGroup, {
    localKey: 'id',
    foreignKey: 'account_plan_group_id',
  })
  public group: BelongsTo<typeof AccountPlanGroup>;
}
