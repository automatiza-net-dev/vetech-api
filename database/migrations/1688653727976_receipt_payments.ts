import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'receipt_payments';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.integer('receipt_id').references('receipts.id');
      table.uuid('payment_method_id').references('payment_methods.id');
      table.uuid('tef_flag_id').references('tef_flags.id');
      table.uuid('tef_acquirer_id').references('tef_acquirers.id');
      table.uuid('conference_user_id').references('users.id');

      table.integer('block');
      table.integer('block_installments');
      table.float('installment_value');
      table.dateTime('conference_date');
      table.dateTime('issue_date');
      table.dateTime('expiration_date');
      table.string('nsu_document');
      table.string('status');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
