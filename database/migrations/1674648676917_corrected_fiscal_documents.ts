import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'corrected_fiscal_documents';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('user_id').references('users.id');
      table.uuid('fiscal_document_id').references('fiscal_documents.id');

      table.dateTime('corrected_date');
      table.string('protocol');
      table.dateTime('protocol_date');
      table.text('description');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.timestamp('deleted_at', { useTz: true }).defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
