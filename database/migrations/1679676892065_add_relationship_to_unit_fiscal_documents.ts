import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_fiscal_documents';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('fiscal_document_id')
        .references('id')
        .inTable('fiscal_documents')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('fiscal_document_id');
    });
  }
}
