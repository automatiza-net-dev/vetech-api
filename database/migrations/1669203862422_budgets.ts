import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'budgets';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('client_id').references('patients.id');
      table.uuid('user_id').references('users.id');
      table.uuid('seller_id').references('users.id');
      table.uuid('daily_movement_id').references('daily_movements.id');
      table.uuid('daily_cashier_id').references('daily_cashiers.id');
      table.uuid('conclusion_user_id').references('users.id');
      table.uuid('cancelation_reason_id').references('reasons.id');

      table.datetime('budget_date');
      table.datetime('expiration_date');
      table.float('product_value');
      table.float('service_value');
      table.float('discount_value');
      table.float('total_value');
      table.text('observation');
      table.datetime('finished_at');
      table.text('canceled_observation');
      table.string('status');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.timestamp('deleted_at', { useTz: true }).defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
