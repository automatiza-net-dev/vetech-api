import Hash from '@ioc:Adonis/Core/Hash';
import {
  BaseModel,
  beforeCreate,
  beforeSave,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

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
  public postalCode?: string; // CEP

  @column()
  public address?: string; // Endereço

  @column()
  public number?: string; // Número

  @column()
  public complement?: string; // Complemento

  @column()
  public district?: string; // Bairro

  @column()
  public city?: string; // Cidade

  @column()
  public state?: string; // Estado

  @column()
  public rememberMeToken?: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

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
}
