import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import Plan from 'App/Models/Plan';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';

export enum PlanPriceRecurrence {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export default class PlanPrice extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column({
    columnName: 'plan_price',
    serialize: (data: string) => parseFloat(data),
  })
  public planPrice: number;

  @column()
  public recurrence: PlanPriceRecurrence;

  @column({
    columnName: 'expiration_days',
  })
  public expirationDays: number;

  @column({
    columnName: 'plan_id',
  })
  public plan_id: string;

  @belongsTo(() => Plan, {})
  public plan: BelongsTo<typeof Plan>;

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
}
