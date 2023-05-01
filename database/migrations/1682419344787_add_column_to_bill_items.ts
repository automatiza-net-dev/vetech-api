import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_items';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.integer('kit_id').references('kits.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('kit_id');
    });
  }
}
