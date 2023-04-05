import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'issued_fiscal_documents';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('fiscal_document_id')
        .references('business_unit_fiscal_documents.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('fiscal_document_id');
    });
  }
}
