import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export const REASON_TYPES = ['RA'] as const;

export default class Reason extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public reason: string;

  @column()
  public type: typeof REASON_TYPES[number];

  @column({
    columnName: 'requires_observation',
  })
  public requiresObservation: boolean;

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
    columnName: 'economic_group_id',
    serializeAs: null,
  })
  public economicGroupId: string;
}
