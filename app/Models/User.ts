import Hash from '@ioc:Adonis/Core/Hash';
import {
  BaseModel,
  beforeCreate,
  beforeFetch,
  beforeFind,
  beforeSave,
  column,
} from '@ioc:Adonis/Lucid/Orm';
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
  public document: string;

  @column()
  public phone?: string;

  @column({
    columnName: 'profile_picture',
  })
  public profilePicture?: string;

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

  @column()
  public active?: boolean;

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
