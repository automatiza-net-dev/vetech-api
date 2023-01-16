import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_payments';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('nsu_document');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('nsu_document');
    });
  }
}
