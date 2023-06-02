import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm';
import BusinessUnitProduct from 'App/Models/BusinessUnitProduct';
import Product from 'App/Models/Product';
import VariationOption from 'App/Models/VariationOption';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import KitItem from './KitItem';

export default class ProductVariation extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public barcode: string;

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
  public product_id: string;

  @belongsTo(() => Product, {
    foreignKey: 'product_id',
  })
  public product: BelongsTo<typeof Product>;

  @hasMany(() => BusinessUnitProduct, {
    localKey: 'id',
    foreignKey: 'product_variation_id',
  })
  public businessUnitProducts: HasMany<typeof BusinessUnitProduct>;

  @manyToMany(() => VariationOption, {
    pivotTable: 'product_variation_options',
    pivotTimestamps: false,
    localKey: 'id',
    pivotForeignKey: 'product_variation_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'variation_option_id',
  })
  public variationOptions: ManyToMany<typeof VariationOption>;

  @hasMany(() => KitItem, {
    localKey: 'id',
    foreignKey: 'product_variation_id',
  })
  public kitItems: HasMany<typeof KitItem>;
}
