import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'payment_methods';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('checking_account_id').references('checking_accounts.id');

      table.string('description');
      table.boolean('requires_document').defaultTo(false);
      table.string('tef');
      table.string('type');
      table.float('fee');
      table.boolean('automatic_cancellation');
      table.integer('days_first_installment');
      table.integer('days_between_installments');
      table.integer('days_until_transfer');
      table.integer('installments_without_password');
      table.integer('max_installments');
      table.boolean('allow_change_expiration_date').defaultTo(false);
      table.float('minimum_installment_value');
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
