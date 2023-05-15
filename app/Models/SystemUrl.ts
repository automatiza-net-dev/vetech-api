import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import System from 'App/Models/System';
import { DateTime } from 'luxon';

export default class SystemUrl extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public url: string;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public system_id: number;

  @belongsTo(() => System, {
    foreignKey: 'system_id',
  })
  public system: BelongsTo<typeof System>;
}
