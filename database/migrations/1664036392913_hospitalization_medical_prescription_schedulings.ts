import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalization_medical_prescription_schedulings';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table
        .uuid('hospitalization_medical_prescription_id')
        .references('hospitalization_medical_prescriptions.id');
      table.uuid('hospitalization_id');
      table.uuid('user_id').references('users.id');

      table.string('type');
      table.string('frequency');
      table.dateTime('scheduled_at');
      table.dateTime('executed_at');
      table.dateTime('prescribed_at');
      table.text('description');
      table.text('resume');
      table.string('status');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
