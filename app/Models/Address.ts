import { DateTime } from 'luxon';
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import User from 'App/Models/User';

export const AddressTypes = [
  'Casa',
  'Apartamento',
  'Condomínio Horizontal',
  'Chácara / Sítio',
  'Comercial',
] as const;

export default class Address extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public main: boolean;

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
  public code: number;

  @column()
  public type: typeof AddressTypes[number];

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>;
}
