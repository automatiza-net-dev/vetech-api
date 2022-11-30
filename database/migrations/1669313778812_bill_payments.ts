import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_payments';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('bill_id').references('bills.id');
      table.uuid('payment_method_id').references('payment_methods.id');
      table.uuid('tef_flag_id').references('tef_flags.id');
      table.uuid('tef_acquirer_id').references('tef_acquirers.id');

      table.integer('block');
      table.datetime('expiration_date');
      table.string('fee_type');
      table.float('fee_value');
      table.float('fee_percentage');
      table.float('installment_value');
      table.integer('total_value');
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
