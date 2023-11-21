import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'receipts';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.dropPrimary();
      table.uuid('_id').primary();
      table.dropColumn('id');
    });
    this.schema.alterTable(this.tableName, table => {
      table.renameColumn('_id', 'id');
    });
  }

  public async down() {}
}
