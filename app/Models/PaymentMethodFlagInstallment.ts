import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import PaymentMethodFlag from 'App/Models/PaymentMethodFlag';
import { DateTime } from 'luxon';

export default class PaymentMethodFlagInstallment extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public installment: number;

  @column()
  public fee: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public payment_method_flag_id: string;

  @belongsTo(() => PaymentMethodFlag, {
    foreignKey: 'payment_method_flag_id',
  })
  public flag: BelongsTo<typeof PaymentMethodFlag>;
}
