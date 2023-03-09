import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import VariationGroup from 'App/Models/VariationGroup';
import { DateTime } from 'luxon';

export default class BusinessUnitConfig extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({
    columnName: 'xml_download_authorization',
  })
  public xmlDownloadAuthorization: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @column({
    serializeAs: null,
  })
  public sale_exit_account_plan_id: string;

  @column({
    serializeAs: null,
  })
  public other_exit_account_plan_id: string;

  @column({
    serializeAs: null,
  })
  public order_entry_account_plan_id: string;

  @column({
    serializeAs: null,
  })
  public other_entry_account_plan_id: string;

  @column({
    serializeAs: null,
  })
  public service_variation_group_id: string;

  @belongsTo(() => VariationGroup, {
    foreignKey: 'service_variation_group_id',
  })
  serviceVariationGroup: BelongsTo<typeof VariationGroup>;
}
