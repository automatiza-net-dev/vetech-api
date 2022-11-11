import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class PaymentMethodFlag extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column({
    columnName: 'max_installments',
  })
  public maxInstallments: number;

  @column()
  public fee: number;

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

  @column({
    serializeAs: null,
  })
  public tef_flag_id: string;

  @column({
    serializeAs: null,
  })
  public checking_account_id: string;
}
