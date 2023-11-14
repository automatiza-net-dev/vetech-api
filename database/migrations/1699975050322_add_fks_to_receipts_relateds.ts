import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableNames = ['receipt_items', 'receipt_payments'];

  public async up() {
    for (const tableName of this.tableNames) {
      this.schema.alterTable(tableName, table => {
        table
          .uuid('receipt_id')
          .references('id')
          .inTable('receipts')
          .onDelete('CASCADE');
      });
    }
  }

  public async down() {
    for (const tableName of this.tableNames) {
      this.schema.alterTable(tableName, table => {
        table
          .integer('receipt_id')
          .unsigned()
          .references('id')
          .inTable('receipts')
          .onDelete('CASCADE');
      });
    }
  }
}
