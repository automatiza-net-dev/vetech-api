import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'treatment_executions';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.integer('treatment_id').references('treatments.id');
      table.integer('treatment_item_id').references('treatment_items.id');
      table.uuid('schedule_user_id').references('users.id');
      table.uuid('schedule_id').references('schedules.id');
      table.uuid('execution_user_id').references('users.id');

      table.integer('quantity_executed');
      table.dateTime('schedule_date');
      table.dateTime('execution_date');
      table.text('observations');
      table.string('status');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
