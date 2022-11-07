import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'daily_cashier_logs';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('daily_cashier_id').references('daily_cashiers.id');
      table.uuid('user_who_reopened_id').references('users.id');
      table.uuid('user_who_closed_id').references('users.id');

      table.dateTime('reopening_date');
      table.dateTime('closing_date');

      table.decimal('opening_balance', 12, 2);
      table.decimal('cashier_funds', 12, 2);
      table.decimal('sales_total', 12, 2);
      table.decimal('expenses_total', 12, 2);
      table.decimal('receipts_total', 12, 2);
      table.decimal('cashier_total', 12, 2);
      table.decimal('cashier_balance', 12, 2);

      table.text('observations');

      table.timestamp('created_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
