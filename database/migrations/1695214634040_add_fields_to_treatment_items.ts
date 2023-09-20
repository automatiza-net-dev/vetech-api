import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'treatment_items';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.integer('reference_item_id');
      table
        .integer('productivity_item_id')
        .references('id')
        .inTable('productivity_items');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('reference_item_id');
      table.dropColumn('productivity_item_id');
    });
  }
}
