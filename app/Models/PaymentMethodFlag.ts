import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import PaymentMethodFlagInstallment from 'App/Models/PaymentMethodFlagInstallment';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import TefAcquirer from './TefAcquirer';
import TefFlag from './TefFlag';

export default class PaymentMethodFlag extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column({
    columnName: 'max_installments',
  })
  public maxInstallments: number;

  @column({
    columnName: 'days_until_transfer',
  })
  public daysUntilTransfer: number;

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
  public payment_method_id: string;

  @column({
    serializeAs: null,
  })
  public tef_acquirer_id: string;

  @belongsTo(() => TefAcquirer, {
    foreignKey: 'tef_acquirer_id',
  })
  public acquirer: BelongsTo<typeof TefAcquirer>;

  @column({
    serializeAs: null,
  })
  public tef_flag_id: string;

  @belongsTo(() => TefFlag, {
    foreignKey: 'tef_flag_id',
  })
  public flag: BelongsTo<typeof TefFlag>;

  @column({
    serializeAs: null,
  })
  public checking_account_id: string;

  @hasMany(() => PaymentMethodFlagInstallment, {
    foreignKey: 'payment_method_flag_id',
  })
  public installments: HasMany<typeof PaymentMethodFlagInstallment>;
}
