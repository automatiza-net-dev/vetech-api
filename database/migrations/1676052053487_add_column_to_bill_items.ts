import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_items';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.timestamp('disabled_at', { useTz: true });
      table.dropColumn('deleted_at');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('disabled_at');
      table.timestamp('deleted_at', { useTz: true });
    });
  }
}
