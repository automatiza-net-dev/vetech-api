import Hash from '@ioc:Adonis/Core/Hash';
import {
  BaseModel,
  beforeCreate,
  beforeFetch,
  beforeFind,
  beforeSave,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
import Invite from 'App/Models/Invite';
import Schedule from 'App/Models/Schedule';
import UnavailableDay from 'App/Models/UnavailableDay';
import UserUnitRole from 'App/Models/UserUnitRole';
import WorkingDay from 'App/Models/WorkingDay';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public name: string;

  @column()
  public email: string;

  @column({ serializeAs: null })
  public password: string;

  @column()
  public document?: string;

  @column()
  public inscription?: string;

  @column.dateTime({
    columnName: 'birth_date',
  })
  public birthDate?: DateTime;

  @column()
  public phone?: string;

  @column({
    columnName: 'profile_picture',
  })
  public profilePicture?: string;

  @column({
    columnName: 'licensing_job',
  })
  public licensingJob?: string;

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
  public rememberMeToken?: string;

  @column({
    columnName: 'on_duty',
  })
  public onDuty: boolean;

  @column()
  public active?: boolean;

  @manyToMany(() => EconomicGroup, {
    pivotTable: 'users_economic_groups',
    pivotTimestamps: true,
  })
  public economicGroups: ManyToMany<typeof EconomicGroup>;

  @hasMany(() => UserUnitRole, {
    foreignKey: 'user_id',
    localKey: 'id',
  })
  public roles: HasMany<typeof UserUnitRole>;

  @hasMany(() => Invite, {
    localKey: 'id',
    foreignKey: 'business_unit_id',
  })
  public invites: HasMany<typeof Invite>;

  @hasMany(() => WorkingDay, {
    localKey: 'id',
    foreignKey: 'user_id',
  })
  public workingDays: HasMany<typeof WorkingDay>;

  @hasMany(() => UnavailableDay, {
    localKey: 'id',
    foreignKey: 'user_id',
  })
  public unavailableDays: HasMany<typeof UnavailableDay>;

  @hasMany(() => Schedule, {
    localKey: 'id',
    foreignKey: 'user_id',
  })
  public schedules: HasMany<typeof Schedule>;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime;

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password);
    }
  }

  @beforeCreate()
  public static async checkId(user: User) {
    if (!user.id) {
      user.id = v4();
    }
  }

  @beforeFind()
  public static softDeletesFind = softDeleteQuery;

  @beforeFetch()
  public static softDeletesFetch = softDeleteQuery;

  public async softDelete(column?: string) {
    await softDelete(this, column);
  }
}
