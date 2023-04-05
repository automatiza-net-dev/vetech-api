import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_products';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('product_id').references('products.id');
      table.uuid('businness_unit_id').references('business_units.id');

      table.decimal('stock', 10, 3).notNullable();
      table.decimal('maximum_stock', 10, 3).notNullable();
      table.decimal('minimum_stock', 10, 3).notNullable();
      table.decimal('maximum_discount_percentage', 10, 3).notNullable();
      table.decimal('maximum_discount_value', 10, 3).notNullable();
      table.decimal('price', 10, 3).notNullable();
      table.decimal('cost_price', 10, 3).notNullable();
      table.decimal('profit_margin', 10, 3).notNullable();

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
