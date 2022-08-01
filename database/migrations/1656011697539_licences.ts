import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'licences';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('business_unit_id').references('business_units.id');
      table.timestamp('expiration_date', { useTz: true });
      table.string('type');
      table.uuid('plan_price_id').references('plan_prices.id').nullable();
      table.decimal('licence_value', 10, 2).unsigned().nullable();
      table.boolean('active');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
