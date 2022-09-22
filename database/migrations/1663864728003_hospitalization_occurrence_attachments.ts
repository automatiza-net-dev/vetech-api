import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalization_occurrence_attachments';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table
        .uuid('hospitalization_occurrence_id')
        .references('hospitalization_occurrences.id');

      table.string('attachment');

      table.timestamp('created_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
