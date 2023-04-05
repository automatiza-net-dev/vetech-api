import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'fiscal_documents';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.string('document_type');
      table.string('movement_type');
      table.string('description');
      table.string('model');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
