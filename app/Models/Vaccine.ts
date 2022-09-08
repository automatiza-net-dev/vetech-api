import {
  BaseModel,
  beforeFetch,
  beforeFind,
  belongsTo,
  BelongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import Subgroup from 'App/Models/Subgroup';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum VaccineType {
  VACCINE = 'vaccine',
  VERMIFUGE = 'vermifuge',
}

export default class Vaccine extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public name: string;

  @column()
  public description: string;

  @column()
  public active: boolean;

  @column()
  public type: VaccineType;

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

  @column()
  public business_unit_id?: string;

  @belongsTo(() => BusinessUnit, {})
  public businessUnit: BelongsTo<typeof BusinessUnit>;

  @column()
  public subgroup_id: string;

  @belongsTo(() => Subgroup, {
    foreignKey: 'subgroup_id',
  })
  public subgroup: BelongsTo<typeof Subgroup>;
}
