import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_exam_attachments';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('patient_exam_id').references('patient_exams.id');
      table.uuid('user_id').references('users.id');

      table.datetime('realized_at');
      table.string('attachment');

      table.timestamp('created_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
