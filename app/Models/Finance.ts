import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import TefAcquirer from 'App/Models/TefAcquirer';
import TefFlag from 'App/Models/TefFlag';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import AccountPlan from './AccountPlan';
import Patient from './Patient';
import PaymentMethod from './PaymentMethod';

export enum FinanceType {
  C = 'CREDITO',
  D = 'DEBITO',
}

export enum FinanceAccept {
  S = 'SIM',
  N = 'NAO',
}

export enum FinanceOriginFlag {
  C = 'CAIXA_DIARIO',
  B = 'BANCARIO',
  F = 'FINANCEIRO',
  E = 'NOTA_ENTRADA',
  S = 'NOTA_SAIDA',
}

export enum FinanceOriginDownFlag {
  C = 'CAIXA_DIARIO',
  B = 'BANCARIO',
  F = 'FINANCEIRO',
}

export enum FinanceStatus {
  A = 'ABERTO',
  B = 'BAIXADO',
  E = 'EXCLUIDO',
}

export default class Finance extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public type: FinanceType;

  @column({
    columnName: 'fee_discount_value',
  })
  public feeDiscountValue: number;

  @column({
    columnName: 'fee_discount_percentage',
  })
  public feeDiscountPercentage: number;

  @column()
  public document: string;

  @column()
  public reconciled: boolean;

  @column()
  public installment: number;

  @column()
  public historic: string;

  @column.dateTime({
    columnName: 'issue_date',
  })
  public issueDate: DateTime;

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
    columnName: 'original_value',
  })
  public originalValue: number;

  @column()
  public value: number;

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

  @column()
  public observation: string;

  @column({
    columnName: 'origin_flag',
  })
  public originFlag: FinanceOriginFlag;

  @column({
    columnName: 'origin_down_flag',
  })
  public originDownFlag: FinanceOriginDownFlag;

  @column()
  public accept: FinanceAccept;

  @column({
    columnName: 'reversal_reason',
  })
  public reversalReason: string;

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
  public bank: string;

  @column()
  public agency: string;

  @column()
  public account: string;

  @column()
  public status: FinanceStatus;

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

  @column({
    serializeAs: null,
  })
  public banking_id: string;

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
  public acquirer_id: string;

  @belongsTo(() => TefAcquirer, {
    foreignKey: 'acquirer_id',
  })
  public acquirer: BelongsTo<typeof TefAcquirer>;
}
