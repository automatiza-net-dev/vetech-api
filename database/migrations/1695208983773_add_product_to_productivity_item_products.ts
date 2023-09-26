import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'productivity_item_products';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('product_variation_id');
      table
        .uuid('product_id')
        .references('id')
        .inTable('products')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('product_variation_id')
        .references('id')
        .inTable('product_variations')
        .onDelete('CASCADE');
      table.dropColumn('product_variation_id');
    });
  }
}
