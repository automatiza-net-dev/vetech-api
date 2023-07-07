import {
  BaseModel,
  BelongsTo,
  HasMany,
  belongsTo,
  column,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import CrmStatus from 'App/Models/CrmStatus';
import OpportunityActivity from 'App/Models/OpportunityActivity';
import Patient from 'App/Models/Patient';
import User from 'App/Models/User';
import { DateTime } from 'luxon';

export default class Opportunity extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({
    columnName: 'opening_date',
  })
  public openingDate: DateTime;

  @column.dateTime({
    columnName: 'closing_date',
  })
  public closingDate: DateTime;

  @column.dateTime({
    columnName: 'contact_date',
  })
  public contactDate: DateTime;

  @column()
  public description: string;

  @column()
  public observation: string;

  @column({
    columnName: 'result_observation',
  })
  public resultObservation: string;

  @column()
  public value: number;

  @column({
    columnName: 'profit_value',
  })
  public profitValue: number;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public system_id: number;

  @column({
    serializeAs: null,
  })
  public economic_group_id: string;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @belongsTo(() => BusinessUnit, {
    foreignKey: 'business_unit_id',
  })
  public unit: BelongsTo<typeof BusinessUnit>;

  @column({
    serializeAs: null,
  })
  public opening_user_id: string;

  @column({
    serializeAs: null,
  })
  public closing_user_id: string;

  @column({
    serializeAs: null,
  })
  public user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>;

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
  public client_origin_id: string;

  @column({
    serializeAs: null,
  })
  public contact_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'contact_id',
  })
  public contact: BelongsTo<typeof Patient>;

  @column({
    serializeAs: null,
  })
  public status_id: number;

  @belongsTo(() => CrmStatus, {
    foreignKey: 'status_id',
  })
  public status: BelongsTo<typeof CrmStatus>;

  @column({
    serializeAs: null,
  })
  public contact_type_id: number;

  @column({
    serializeAs: null,
  })
  public contact_subject_id: number;

  @column({
    serializeAs: null,
  })
  public reason_id: number;

  @hasMany(() => OpportunityActivity, {
    foreignKey: 'opportunity_id',
  })
  public activities: HasMany<typeof OpportunityActivity>;
}
