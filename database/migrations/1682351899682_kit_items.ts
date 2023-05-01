import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'kit_items';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .integer('kit_id')
        .unsigned()
        .references('id')
        .inTable('kits')
        .onDelete('CASCADE');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('product_variation_id').references('product_variations.id');

      table.integer('quantity');
      table.float('original_price');
      table.float('discount_price');
      table.float('discount_percentage');
      table.float('sale_price');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
