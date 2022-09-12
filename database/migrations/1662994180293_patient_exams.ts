import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_exams';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('exam_id').references('exams.id');
      table.uuid('patient_id').references('patients.id');
      table.uuid('user_id').references('users.id');
      table.uuid('schedule_id').references('schedules.id');
      table.uuid('business_id').references('business_units.id');

      table.timestamp('realized_at');
      table.string('laboratory');
      table.string('report');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
