import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export const PATHOLOGY_UUID = '5f6b40d0-5976-4fee-9162-91c7bbb750fb';
export const DOCUMENT_UUID = '745a4fb1-f0b4-43ee-a97e-377faeefa84f';
export const RECIPE_UUID = '15a959c1-c509-4a11-9a98-4ea54e12398d';

export default class TimelineType extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public description: string;

  @column()
  public color: string;

  @column({
    columnName: 'requires_observation',
  })
  public requiresObservation: boolean;

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
}
