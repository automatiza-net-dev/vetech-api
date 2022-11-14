import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'payment_method_flags';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('payment_method_id').references('payment_methods.id');
      table.uuid('tef_flag_id').references('tef_flags.id');
      table.uuid('tef_acquirer_id').references('tef_acquirers.id');
      table.uuid('checking_account_id').references('checking_accounts.id');

      table.integer('max_installments');
      table.float('fee');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.timestamp('deleted_at', { useTz: true }).defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
