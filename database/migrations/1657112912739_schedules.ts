import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedules';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('business_unit_id').references('business_units.id');
      table
        .uuid('schedule_service_type_id')
        .references('schedule_service_types.id');
      table.uuid('schedule_status_id').references('schedule_statuses.id');
      table.uuid('race_id').references('races.id').nullable();
      table.uuid('user_id').references('users.id').nullable();
      table.uuid('patient_id').references('patients.id').nullable();

      table.string('patient_name').nullable();
      table.string('patient_phone').nullable();
      table.timestamp('start_hour');
      table.timestamp('end_hour');
      table.integer('age').unsigned().nullable();
      table.text('major_complaint').nullable();

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
