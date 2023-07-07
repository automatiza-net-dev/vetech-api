import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import PaymentMethod from 'App/Models/PaymentMethod';
import TefAcquirer from 'App/Models/TefAcquirer';
import TefFlag from 'App/Models/TefFlag';
import { DateTime } from 'luxon';

export const ReceiptPaymentStatus = ['Ativo'] as const;

export default class ReceiptPayment extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public block: number;

  @column({
    columnName: 'block_installments',
  })
  public blockInstallments: number;

  @column({
    columnName: 'installment_value',
  })
  public installmentValue: number;

  @column({
    columnName: 'nsu_document',
  })
  public nsuDocument: string;

  @column.dateTime({
    columnName: 'issue_date',
  })
  public issueDate: DateTime;

  @column.dateTime({
    columnName: 'conference_date',
  })
  public conferenceDate: DateTime;

  @column.dateTime({
    columnName: 'expiration_date',
  })
  public expirationDate: DateTime;

  @column()
  public status: typeof ReceiptPaymentStatus[number];

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

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
  public receipt_id: number;

  @column({
    serializeAs: null,
  })
  public conference_user_id: string;

  @column({
    serializeAs: null,
  })
  public payment_method_id: string;

  @belongsTo(() => PaymentMethod, {
    foreignKey: 'payment_method_id',
  })
  public paymentMethod: BelongsTo<typeof PaymentMethod>;

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
  public tef_acquirer_id: string;

  @belongsTo(() => TefAcquirer, {
    foreignKey: 'tef_acquirer_id',
  })
  public acquirer: BelongsTo<typeof TefAcquirer>;
}
