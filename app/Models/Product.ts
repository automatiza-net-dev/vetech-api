import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import BusinessUnitProduct from 'App/Models/BusinessUnitProduct';
import EconomicGroup from 'App/Models/EconomicGroup';
import ProductVariation from 'App/Models/ProductVariation';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum ProductType {
  SERVICE = 'service',
  PRODUCT = 'product',
}

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public description: string;

  @column()
  public type: ProductType;

  @column({
    columnName: 'reference_code',
  })
  public referenceCode: string;

  @column({
    columnName: 'collection_year',
  })
  public collectionYear: number;

  @column()
  public ncm: string;

  @column()
  public cest: string;

  @column()
  public features: string;

  @column({
    columnName: 'unity_type',
  })
  public unityType: string;

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

  @column()
  public economic_group_id: boolean;

  @belongsTo(() => EconomicGroup)
  public economicGroup: BelongsTo<typeof EconomicGroup>;

  @hasMany(() => BusinessUnitProduct, {
    localKey: 'id',
    foreignKey: 'product_id',
  })
  public businessUnitProducts: HasMany<typeof BusinessUnitProduct>;

  @hasMany(() => ProductVariation, {
    localKey: 'id',
    foreignKey: 'product_id',
  })
  public variations: HasMany<typeof ProductVariation>;
}
