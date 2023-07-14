import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'productivity_item_products';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .uuid('economic_group_id')
        .references('id')
        .inTable('economic_groups')
        .onDelete('CASCADE');
      table
        .integer('productivity_item_id')
        .unsigned()
        .references('id')
        .inTable('productivity_items')
        .onDelete('CASCADE');
      table
        .uuid('product_variation_id')
        .references('id')
        .inTable('product_variations')
        .onDelete('CASCADE');

      table.integer('quantity');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
