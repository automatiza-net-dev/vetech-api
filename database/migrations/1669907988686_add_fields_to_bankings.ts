import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bankings';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('user_document');
      table.string('nsu_document');
      table.string('bar_code');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('user_document');
      table.dropColumn('nsu_document');
      table.dropColumn('bar_code');
    });
  }
}
