import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'service_issued_fiscal_document_items';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .uuid('service_issued_fiscal_document_id')
        .references('id')
        .inTable('service_issued_fiscal_documents')
        .onDelete('CASCADE');
      table
        .uuid('bill_item_id')
        .references('id')
        .inTable('bill_items')
        .onDelete('CASCADE');

      table.timestamp('created_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
