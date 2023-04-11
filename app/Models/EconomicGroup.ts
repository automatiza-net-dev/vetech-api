import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import DocumentTemplate from 'App/Models/DocumentTemplate';
import Group from 'App/Models/Group';
import MedicalDocumentTemplate from 'App/Models/MedicalDocumentTemplate';
import Pathology from 'App/Models/Pathology';
import Patient from 'App/Models/Patient';
import PaymentMethod from 'App/Models/PaymentMethod';
import Product from 'App/Models/Product';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import ScheduleStatus from 'App/Models/ScheduleStatus';
import Specie from 'App/Models/Specie';
import Subgroup from 'App/Models/Subgroup';
import System from 'App/Models/System';
import TaxationGroup from 'App/Models/TaxationGroup';
import UnavailableDay from 'App/Models/UnavailableDay';
import User from 'App/Models/User';
import Variation from 'App/Models/Variation';
import VariationGroup from 'App/Models/VariationGroup';
import WorkingDay from 'App/Models/WorkingDay';
import { DateTime } from 'luxon';

export default class EconomicGroup extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column({
    columnName: 'fantasy_name',
  })
  public fantasyName: string;

  @column({
    columnName: 'company_name',
  })
  public companyName: string;

  @column({})
  public document: string;

  @column({
    columnName: 'responsible_email',
  })
  public responsibleEmail: string;

  @column({
    columnName: 'responsible_phone',
  })
  public responsiblePhone: string;

  @manyToMany(() => User, {
    pivotTable: 'users_economic_groups',
    pivotTimestamps: true,
  })
  public users: ManyToMany<typeof User>;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public system_id: number;

  @belongsTo(() => System, {
    localKey: 'id',
    foreignKey: 'system_id',
  })
  public system: BelongsTo<typeof System>;

  @hasMany(() => BusinessUnit, {})
  public businessUnits: HasMany<typeof BusinessUnit>;

  @manyToMany(() => Patient, {
    pivotTable: 'patient_economic_groups',
    pivotTimestamps: true,
  })
  public patients: ManyToMany<typeof Patient>;

  @hasMany(() => Specie, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public species: HasMany<typeof Specie>;

  @hasMany(() => ScheduleStatus, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public scheduleStatuses: HasMany<typeof ScheduleStatus>;

  @hasMany(() => ScheduleServiceGroup, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public scheduleServiceGroups: HasMany<typeof ScheduleServiceGroup>;

  @hasMany(() => ScheduleServiceType, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public scheduleServiceTypes: HasMany<typeof ScheduleServiceType>;

  @hasMany(() => WorkingDay, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public workingDays: HasMany<typeof WorkingDay>;

  @hasMany(() => UnavailableDay, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public unavailableDays: HasMany<typeof UnavailableDay>;

  @hasMany(() => Group, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public groups: HasMany<typeof Group>;

  @hasMany(() => Subgroup, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public subgroups: HasMany<typeof Subgroup>;

  @hasMany(() => Product, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public products: HasMany<typeof Product>;

  @hasMany(() => Variation, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public variations: HasMany<typeof Variation>;

  @hasMany(() => VariationGroup, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public variationGroups: HasMany<typeof VariationGroup>;

  @hasMany(() => Pathology, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public pathologies: HasMany<typeof Pathology>;

  @hasMany(() => MedicalDocumentTemplate, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public medicalDocumentTemplates: HasMany<typeof MedicalDocumentTemplate>;

  @hasMany(() => DocumentTemplate, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public documentTemplates: HasMany<typeof DocumentTemplate>;

  @hasMany(() => PaymentMethod, {
    localKey: 'id',
    foreignKey: 'economicGroupId',
  })
  public paymentMethods: HasMany<typeof PaymentMethod>;

  @hasMany(() => TaxationGroup, {
    localKey: 'id',
    foreignKey: 'economic_group_id',
  })
  public taxationGroups: HasMany<typeof TaxationGroup>;
}
