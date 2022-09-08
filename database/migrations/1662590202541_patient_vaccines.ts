import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_vaccines';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('vaccine_id').references('vaccines.id');
      table.uuid('vaccine_protocol_id').references('vaccine_protocols.id');
      table.uuid('patient_id').references('patients.id');
      table.uuid('user_id').references('users.id');
      table.uuid('schedule_id').references('schedules.id');
      table.uuid('business_unit_id').references('business_units.id');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
