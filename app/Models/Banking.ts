import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import AccountPlan from 'App/Models/AccountPlan';
import Patient from 'App/Models/Patient';
import PaymentMethod from 'App/Models/PaymentMethod';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import CheckingAccount from './CheckingAccount';

export enum BankingType {
  C = 'CREDITO',
  D = 'DEBITO',
}

export enum BankingOriginFlag {
  F = 'FINANCEIRO',
  B = 'BANCARIO',
}

export enum BankingStatus {
  B = 'BAIXADO',
}

export default class Banking extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public type: BankingType;

  @column()
  public document: string;

  @column()
  public installment: number;

  @column()
  public historic: string;

  @column({
    columnName: 'issue_date',
  })
  public issueDate: DateTime;

  @column({
    columnName: 'document_value',
  })
  public documentValue: number;

  @column({
    columnName: 'total_value',
  })
  public totalValue: number;

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
    columnName: 'payment_method_discount_value',
  })
  public paymentMethodDiscountValue: number;

  @column({
    columnName: 'payment_method_discount_percentage',
  })
  public paymentMethodDiscountPercentage: number;

  @column()
  public balance: number;

  @column({
    columnName: 'prev_balance',
  })
  public prevBalance: number;

  @column({
    columnName: 'origin_flag',
  })
  public originFlag: BankingOriginFlag;

  @column()
  public reconciled: boolean;

  @column()
  public observation: string;

  @column({
    columnName: 'competence_date',
  })
  public competenceDate: string;

  @column({
    columnName: 'fiscal_note',
  })
  public fiscalNote: string;

  @column({
    columnName: 'user_document',
  })
  public userDocument: string;

  @column({
    columnName: 'nsu_document',
  })
  public nsuDocument: string;

  @column({
    columnName: 'bar_code',
  })
  public barCode: string;

  @column()
  public status: BankingStatus;

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
  public client_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'client_id',
  })
  public client: BelongsTo<typeof Patient>;

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

  @belongsTo(() => CheckingAccount, {
    foreignKey: 'checking_account_id',
  })
  public checkingAccount: BelongsTo<typeof CheckingAccount>;

  @column({
    serializeAs: null,
  })
  public finance_id: string;

  @column({
    serializeAs: null,
  })
  public account_plan_id: string;

  @belongsTo(() => AccountPlan, {
    foreignKey: 'account_plan_id',
  })
  public accountPlan: BelongsTo<typeof AccountPlan>;

  @column({
    serializeAs: null,
  })
  public payment_method_id: string;

  @belongsTo(() => PaymentMethod, {
    foreignKey: 'payment_method_id',
  })
  public paymentMethod: BelongsTo<typeof PaymentMethod>;
}
