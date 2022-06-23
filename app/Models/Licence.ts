import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import PlanPrice from 'App/Models/PlanPrice';
import { DateTime } from 'luxon';

export enum LicenceType {
  TRIAL = 'trial',
  ADDITIONAL_TRIAL = 'additional_trial',
  PAY = 'pay',
  MANUAL = 'manual',
}

export default class Licence extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @belongsTo(() => BusinessUnit)
  public businessUnit: BelongsTo<typeof BusinessUnit>;

  @column({
    columnName: 'expiration_date',
  })
  public expirationDate: Date;

  @column({})
  public type: LicenceType;

  @belongsTo(() => PlanPrice, {})
  public planPrice: BelongsTo<typeof PlanPrice>;

  @column({
    columnName: 'licence_value',
    serialize: (data: string) => parseFloat(data),
  })
  public licenceValue?: number;

  @column({})
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}
