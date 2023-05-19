import {
  BaseModel,
  BelongsTo,
  HasMany,
  belongsTo,
  column,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import Bill from 'App/Models/Bill';
import Patient from 'App/Models/Patient';
import Reason from 'App/Models/Reason';
import TreatmentExecution from 'App/Models/TreatmentExecution';
import TreatmentItem from 'App/Models/TreatmentItem';
import User from 'App/Models/User';
import { DateTime } from 'luxon';

const TreatmentStatus = ['Confirmado', 'Aberto', 'Cancelado'] as const;
export type TreatmentStatus = typeof TreatmentStatus[number];

export default class Treatment extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({
    columnName: 'emission_date',
  })
  public emissionDate: DateTime;

  @column({
    columnName: 'cancellation_date',
  })
  public cancellationDate: DateTime | null;

  @column()
  public observations: string;

  @column({
    columnName: 'cancellation_observations',
  })
  public cancellationObservations: string | null;

  @column()
  public status: TreatmentStatus;

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
  public bill_id: string;

  @belongsTo(() => Bill, {
    foreignKey: 'bill_id',
  })
  public bill: BelongsTo<typeof Bill>;

  @column({
    serializeAs: null,
  })
  public emission_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'emission_user_id',
  })
  public emissionUser: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public cancellation_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'cancellation_user_id',
  })
  public cancellationUser: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public cancellation_reason_id: string;

  @belongsTo(() => Reason, {
    foreignKey: 'cancellation_reason_id',
  })
  public cancellationReason: BelongsTo<typeof Reason>;

  @column({
    serializeAs: null,
  })
  public seller_id: string;

  @belongsTo(() => User, {
    foreignKey: 'seller_id',
  })
  public seller: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public client_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'client_id',
  })
  public client: BelongsTo<typeof Patient>;

  @hasMany(() => TreatmentItem, {
    foreignKey: 'treatment_id',
  })
  public items: HasMany<typeof TreatmentItem>;

  @hasMany(() => TreatmentExecution, {
    foreignKey: 'treatment_id',
  })
  public executions: HasMany<typeof TreatmentExecution>;
}
