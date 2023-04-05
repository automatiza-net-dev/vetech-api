import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'checking_accounts';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('business_unit_id').references('business_units.id');

      table.string('description');
      table.string('account_number');
      table.string('bank_code');
      table.string('bank_name');
      table.string('agency');
      table.string('agency_phone');
      table.string('manager_name');
      table.string('manager_phone');
      table.string('manager_email');
      table.decimal('limit', 12, 2);
      table.decimal('balance', 12, 2);
      table.string('type');
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
