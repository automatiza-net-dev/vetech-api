import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'vaccine_calendars';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('patient_vaccine_id').references('patient_vaccines.id');
      table.uuid('schedule_id').references('schedules.id');
      table.uuid('user_id').references('users.id');
      table.uuid('product_id').references('products.id').nullable();

      table.date('scheduling_date');
      table.date('application_date').nullable();
      table.integer('dose');
      table.string('laboratory').nullable();
      table.string('batch').nullable();

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
