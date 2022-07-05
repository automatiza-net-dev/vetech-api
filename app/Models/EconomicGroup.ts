import {
  BaseModel,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import ScheduleStatus from 'App/Models/ScheduleStatus';
import Specie from 'App/Models/Specie';
import User from 'App/Models/User';
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

  @hasMany(() => BusinessUnit, {})
  public businessUnits: HasMany<typeof BusinessUnit>;

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
}
