import {
  BaseModel,
  beforeFetch,
  beforeFind,
  belongsTo,
  BelongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import Subgroup from 'App/Models/Subgroup';
import VaccineProtocol from 'App/Models/VaccineProtocol';
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

  @column({
    serializeAs: null,
  })
  public economic_group_id?: string;

  @column()
  public subgroup_id: string;

  @belongsTo(() => Subgroup, {
    foreignKey: 'subgroup_id',
  })
  public subgroup: BelongsTo<typeof Subgroup>;

  @hasMany(() => VaccineProtocol, {
    foreignKey: 'vaccine_id',
  })
  public protocols: HasMany<typeof VaccineProtocol>;
}
