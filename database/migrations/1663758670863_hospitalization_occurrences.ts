import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalization_occurrences';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('hospitalization_id').references('hospitalizations.id');
      table.uuid('occurrence_id').references('occurrences.id');
      table.uuid('user_id').references('users.id');
      table
        .uuid('hospitalization_medical_prescription_id')
        .references('hospitalization_medical_prescriptions.id');

      table.dateTime('previewed_at');
      table.dateTime('executed_at');
      table.text('description');
      table.text('resume');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
