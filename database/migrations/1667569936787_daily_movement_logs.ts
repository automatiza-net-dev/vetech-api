import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'daily_movement_logs';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('daily_movement_id').references('daily_movements.id');
      table.uuid('user_who_reopened_id').references('users.id');
      table.uuid('user_who_closed_id').references('users.id');

      table.dateTime('reopening_date');
      table.dateTime('closing_date');
      table.decimal('sales_total', 12, 2);
      table.decimal('expenses_total', 12, 2);
      table.decimal('receipts_total', 12, 2);
      table.text('observations');

      table.timestamp('created_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
