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
export const PHOTO_UUID = '8a4bf0b0-043b-4df2-9d62-13478e985bd1';
export const WEIGHT_UUID = 'b7df5bcb-5d09-412d-afd9-c3104fd29314';
export const OBSERVATION_UUID = 'e12f6b9b-1b0c-42c9-9020-978acf394807';
export const VACCINE_UUID = 'ebb7e7c2-85ca-4d59-b2d7-6c0bfa66d538';
export const EXAM_UUID = 'dcdf4aee-7630-499d-96e5-df56a1d9504a';
export const HOSPITALIZATION_UUID = 'fc89df7a-ed1e-4060-b489-948aad2ca84a';
export const ATTENDANCE_UUID = 'df88f8cc-b2d9-4deb-ae38-3f5269c97cd0';

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

  @column({
    serializeAs: null,
  })
  public system_id: number;
}
