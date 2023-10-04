import {
  BaseModel,
  BelongsTo,
  HasMany,
  belongsTo,
  column,
  hasMany,
  beforeFind,
  beforeFetch,
} from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import CrmStatus from 'App/Models/CrmStatus';
import OpportunityActivity from 'App/Models/OpportunityActivity';
import Patient from 'App/Models/Patient';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';

import ClientOrigin from './ClientOrigin';
import ContactSubject from './ContactSubject';
import ContactType from './ContactType';
import Race from './Race';
import Reason from './Reason';

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

  @column({})
  public balance: string;

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

  @column({})
  public gender: string;

  @column({})
  public weight: number;

  @column({})
  public castrated: boolean;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column.dateTime({
    serializeAs: null,
  })
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

  @belongsTo(() => User, {
    foreignKey: 'opening_user_id',
  })
  public openingUser: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public closing_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'closing_user_id',
  })
  public closingUser: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public exclusion_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'exclusion_user_id',
  })
  public exclusionUser: BelongsTo<typeof User>;

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

  @belongsTo(() => ClientOrigin, {
    foreignKey: 'client_origin_id',
  })
  public clientOrigin: BelongsTo<typeof ClientOrigin>;

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

  @belongsTo(() => ContactType, {
    foreignKey: 'contact_type_id',
  })
  public contactType: BelongsTo<typeof ContactType>;

  @column({
    serializeAs: null,
  })
  public contact_subject_id: number;

  @belongsTo(() => ContactSubject, {
    foreignKey: 'contact_subject_id',
  })
  public contactSubject: BelongsTo<typeof ContactSubject>;

  @column({
    serializeAs: null,
  })
  public reason_id: string;

  @belongsTo(() => Reason, {
    foreignKey: 'reason_id',
  })
  public reason: BelongsTo<typeof Reason>;

  @hasMany(() => OpportunityActivity, {
    foreignKey: 'opportunity_id',
  })
  public activities: HasMany<typeof OpportunityActivity>;

  @column({
    serializeAs: null,
  })
  public schedule_id: string;

  @column({
    serializeAs: null,
  })
  public race_id: string;

  @belongsTo(() => Race, {
    foreignKey: 'race_id',
  })
  public race: BelongsTo<typeof Race>;
}
