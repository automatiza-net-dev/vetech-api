import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'products';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('unit_id').references('id').inTable('units');
      table.dropColumn('unity_type');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('unit_id');
      table.string('unity_type');
    });
  }
}
