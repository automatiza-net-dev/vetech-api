import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum FinanceReversalType {
  B = 'BAIXA',
  E = 'ESTORNO',
}

export default class FinanceReversal extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public type: FinanceReversalType;

  @column({
    columnName: 'fee_discount_value',
  })
  public feeDiscountValue: number;

  @column({
    columnName: 'fee_discount_percentage',
  })
  public feeDiscountPercentage: number;

  @column.dateTime({
    columnName: 'expiration_date',
  })
  public expirationDate: DateTime;

  @column.dateTime({
    columnName: 'payment_date',
  })
  public paymentDate: DateTime;

  @column.dateTime({
    columnName: 'down_date',
  })
  public downDate: DateTime;

  @column({
    columnName: 'total_value',
  })
  public totalValue: number;

  @column({
    columnName: 'payment_value',
  })
  public paymentValue: number;

  @column({
    columnName: 'fee_value',
  })
  public feeValue: number;

  @column({
    columnName: 'fee_percentage',
  })
  public feePercentage: number;

  @column({
    columnName: 'discount_value',
  })
  public discountValue: number;

  @column({
    columnName: 'discount_percentage',
  })
  public discountPercentage: number;

  @column({
    columnName: 'addition_value',
  })
  public additionValue: number;

  @column({
    columnName: 'addition_percentage',
  })
  public additionPercentage: number;

  @column({
    columnName: 'reversal_origin',
  })
  public reversalOrigin: string;

  @column({
    columnName: 'reversal_reason',
  })
  public reversalReason: string;

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
  public finance_id: string;

  @column({
    serializeAs: null,
  })
  public client_id: string;

  @column({
    serializeAs: null,
  })
  public daily_movement_id: string;

  @column({
    serializeAs: null,
  })
  public daily_cashier_id: string;

  @column({
    serializeAs: null,
  })
  public checking_account_id: string;

  @column({
    serializeAs: null,
  })
  public account_plan_id: string;

  @column({
    serializeAs: null,
  })
  public payment_method_id: string;
}
