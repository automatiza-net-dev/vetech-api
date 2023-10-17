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

  @column({
    columnName: 'focus_homologation_token',
  })
  public focusHomologationToken: string;

  @column({
    columnName: 'focus_production_token',
  })
  public focusProductionToken: string;

  @column({
    columnName: 'requires_schedule_tutor',
  })
  public requiresScheduleTutor: boolean;

  @column({
    columnName: 'requires_bill_patient',
  })
  public requiresBillPatient: boolean;

  @column({
    columnName: 'requires_finance_client',
  })
  public requiresFinanceClient: boolean;

  @column({
    columnName: 'fiscal_document_environment',
  })
  public fiscalDocumentEnvironment: string;

  @column({
    columnName: 'allow_change_schedule_duration',
  })
  public allowChangeScheduleDuration: string;

  @column({
    columnName: 'bill_counter',
  })
  public billCounter: string;

  @column({
    columnName: 'budget_counter',
  })
  public budgetCounter: string;

  @column({})
  public interval: number;

  @column({
    columnName: 'locked_daily_movement_date',
  })
  public lockedDailyMovementDate: boolean;

  @column({
    columnName: 'daily_cashier_type',
  })
  public dailyCashierType: 'usuario' | 'geral';

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
