import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import PlanPrice from 'App/Models/PlanPrice';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';

export default class Plan extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public description: string;

  @column({
    columnName: 'trial_days',
  })
  public trialDays: number;

  @column({
    columnName: 'trial_additional',
  })
  public trialAdditional: number;

  @column()
  public default = false;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime;

  @hasMany(() => PlanPrice, {
    foreignKey: 'plan_id',
    localKey: 'id',
  })
  public planPrices: HasMany<typeof PlanPrice>;

  @beforeFind()
  public static softDeletesFind = softDeleteQuery;

  @beforeFetch()
  public static softDeletesFetch = softDeleteQuery;

  public async softDelete(column?: string) {
    await softDelete(this, column);
  }
}
