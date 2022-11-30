import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class UfIcms extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column.dateTime({
    columnName: 'valid_from',
  })
  public validFrom: DateTime;

  @column.dateTime({
    columnName: 'valid_to',
  })
  public validTo: DateTime;

  @column({
    columnName: 'origin_uf',
  })
  public originUf: string;

  @column({
    columnName: 'destination_uf',
  })
  public destinationUf: string;

  @column({
    columnName: 'icms_percentage',
  })
  public icmsPercentage: number;

  @column({
    columnName: 'fcp_icms',
  })
  public fcpIcms: number;

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
}
