import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'daily_movements';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('user_who_opened_id').references('users.id');
      table.uuid('user_who_closed_id').references('users.id');
      table.uuid('user_who_checked_id').references('users.id');

      table.dateTime('opening_date');
      table.dateTime('closing_date');
      table.dateTime('checking_date');
      table.decimal('sales_total', 12, 2);
      table.decimal('expenses_total', 12, 2);
      table.decimal('receipts_total', 12, 2);
      table.text('observations');
      table.string('status');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
