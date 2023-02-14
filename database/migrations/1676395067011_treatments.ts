import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'treatments';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('schedule_service_id').references('schedule_service_types.id');
      table.uuid('service_id').references('products.id');
      table.uuid('schedule_id').references('schedules.id');
      table.uuid('open_user_id').references('users.id');
      table.uuid('close_user_id').references('users.id');
      table.uuid('tutor_id').references('patients.id');
      table.uuid('patient_id').references('patients.id');

      table.text('resume');
      table.text('protocol');
      table.timestamp('start_date', { useTz: true });
      table.timestamp('end_date', { useTz: true });

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
