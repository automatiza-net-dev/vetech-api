import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
import Invite from 'App/Models/Invite';
import Licence from 'App/Models/Licence';
import Schedule from 'App/Models/Schedule';
import UnavailableDay from 'App/Models/UnavailableDay';
import WorkingDay from 'App/Models/WorkingDay';
import { DateTime } from 'luxon';

export default class BusinessUnit extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public identification?: string;

  @column()
  public email?: string;

  @column({
    columnName: 'fantasy_name',
  })
  public fantasyName?: string;

  @column({
    columnName: 'company_name',
  })
  public companyName?: string;

  @column()
  public document?: string;

  @column()
  public phone?: string;

  @column()
  public origin?: string;

  @column({
    columnName: 'postal_code',
  })
  public postalCode?: string;

  @column()
  public address?: string;

  @column()
  public number?: string;

  @column()
  public complement?: string;

  @column()
  public district?: string;

  @column()
  public city?: string;

  @column()
  public state?: string;

  @column()
  public active?: boolean;

  @column()
  public lat?: boolean;

  @column()
  public lng?: boolean;

  @column({
    columnName: 'economic_group_id',
    serializeAs: null,
  })
  public economicGroupId: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => EconomicGroup, {})
  public economicGroup: BelongsTo<typeof EconomicGroup>;

  @hasMany(() => Invite, {
    localKey: 'id',
    foreignKey: 'business_unit_id',
  })
  public invites: HasMany<typeof Invite>;

  @hasMany(() => Licence, {
    localKey: 'id',
    foreignKey: 'business_unit_id',
  })
  public licences: HasMany<typeof Licence>;

  @hasMany(() => Schedule, {
    localKey: 'id',
    foreignKey: 'business_unit_id',
  })
  public schedules: HasMany<typeof Schedule>;

  @hasMany(() => WorkingDay, {
    localKey: 'id',
    foreignKey: 'business_unit_id',
  })
  public workingDays: HasMany<typeof WorkingDay>;

  @hasMany(() => UnavailableDay, {
    localKey: 'id',
    foreignKey: 'business_unit_id',
  })
  public unavailableDays: HasMany<typeof UnavailableDay>;
}
