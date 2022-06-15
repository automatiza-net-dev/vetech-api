import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
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
  })
  public economicGroupId: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => EconomicGroup, {
    localKey: 'economic_group_id',
  })
  public economicGroup: BelongsTo<typeof EconomicGroup>;
}
