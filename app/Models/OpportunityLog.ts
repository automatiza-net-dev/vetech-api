import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import ContactSubject from 'App/Models/ContactSubject';
import ContactType from 'App/Models/ContactType';
import Patient from 'App/Models/Patient';
import { DateTime } from 'luxon';

export default class OpportunityLog extends BaseModel {
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
  public value: number;

  @column({
    columnName: 'profit_value',
  })
  public profitValue: number;

  @column({
    columnName: 'result_observation',
  })
  public resultObservation: string;

  @column()
  public description: string;

  @column()
  public observation: string;

  @column()
  public balance: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public opportunity_id: number;

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
  public opening_user_id: string;

  @column({
    serializeAs: null,
  })
  public closing_user_id: string;

  @column({
    serializeAs: null,
  })
  public user_id: string;

  @column({
    serializeAs: null,
  })
  public status_id: number;

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
  public contact_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'contact_id',
  })
  public contact: BelongsTo<typeof Patient>;

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
}
