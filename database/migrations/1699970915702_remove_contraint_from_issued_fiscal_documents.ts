import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'issued_fiscal_documents';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.dropForeign('bill_id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table
        .foreign('bill_id')
        .references('id')
        .inTable('bills')
        .onDelete('CASCADE');
    });
  }
}
