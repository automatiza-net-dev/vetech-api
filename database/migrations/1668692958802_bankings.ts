import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bankings';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('client_id').references('patients.id');
      table.uuid('daily_movement_id').references('daily_movements.id');
      table.uuid('daily_cashier_id').references('daily_cashiers.id');
      table.uuid('checking_account_id').references('checking_accounts.id');
      table.uuid('finance_id').references('finances.id');
      table.uuid('account_plan_id').references('account_plans.id');
      table.uuid('payment_method_id').references('payment_methods.id');

      table.string('type');
      table.string('document');
      table.integer('installment');
      table.text('historic');
      table.datetime('issue_date');
      table.float('document_value');
      table.float('total_value');
      table.float('fee_value');
      table.float('fee_percentage');
      table.float('discount_value');
      table.float('discount_percentage');
      table.float('payment_method_discount_value');
      table.float('payment_method_discount_percentage');
      table.float('balance');
      table.float('prev_balance');
      table.text('observation');
      table.string('origin_flag');
      table.boolean('reconciled');
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
