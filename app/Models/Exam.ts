import {
  BaseModel,
  beforeFetch,
  beforeFind,
  belongsTo,
  BelongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import Subgroup from 'App/Models/Subgroup';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class Exam extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public name: string;

  @column()
  public description: string;

  @column()
  public type: string;

  @column({
    columnName: 'own_laboratory',
  })
  public ownLaboratory: boolean;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime;

  @beforeFind()
  public static softDeletesFind = softDeleteQuery;

  @beforeFetch()
  public static softDeletesFetch = softDeleteQuery;

  public async softDelete(column?: string) {
    await softDelete(this, column);
  }

  @column({
    serializeAs: null,
  })
  public system_id: number;

  @column({
    serializeAs: null,
  })
  public economic_group_id?: string;

  @column()
  public subgroup_id: string;

  @belongsTo(() => Subgroup, {})
  public subgroup: BelongsTo<typeof Subgroup>;

  @column({
    serializeAs: null,
  })
  public product_id: string;
}
