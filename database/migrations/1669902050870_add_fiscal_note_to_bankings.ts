import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bankings';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('fiscal_note');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('fiscal_note');
    });
  }
}
