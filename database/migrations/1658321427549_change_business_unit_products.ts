import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_products';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('product_id');
      table.uuid('product_variation_id').references('product_variations.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('product_variation_id');
      table.uuid('product_id').references('products.id');
    });
  }
}
