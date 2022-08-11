import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'product_variation_options';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('product_variation_id').references('product_variations.id');
      table.uuid('variation_option_id').references('variation_options.id');

      table.unique(['product_variation_id', 'variation_option_id']);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
