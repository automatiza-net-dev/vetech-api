import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'system_payment_methods';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .integer('system_id')
        .unsigned()
        .references('id')
        .inTable('systems')
        .onDelete('CASCADE');

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
      table.string('usage');
      table.string('nfe_code');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
