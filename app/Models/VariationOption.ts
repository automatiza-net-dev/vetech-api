import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import Variation from 'App/Models/Variation';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class VariationOption extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public description: string;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column()
  public variation_id: string;

  @belongsTo(() => Variation, {})
  public variation: BelongsTo<typeof Variation>;
}
