import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'attendances';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('schedule_id').references('schedules.id');
      table.uuid('attendance_status_id').references('attendance_statuses.id');

      table.text('complaint').notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.text('clinical_examination').notNullable();

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
