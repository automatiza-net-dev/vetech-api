import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_products';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.decimal('stock', 10, 3).nullable().alter();
      table.decimal('maximum_stock', 10, 3).nullable().alter();
      table.decimal('minimum_stock', 10, 3).nullable().alter();
      table.decimal('maximum_discount_percentage', 10, 3).nullable().alter();
      table.decimal('maximum_discount_value', 10, 3).nullable().alter();
      table.decimal('price', 10, 3).nullable().alter();
      table.decimal('cost_price', 10, 3).nullable().alter();
      table.decimal('profit_margin', 10, 3).nullable().alter();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.decimal('stock', 10, 3).notNullable().alter();
      table.decimal('maximum_stock', 10, 3).notNullable().alter();
      table.decimal('minimum_stock', 10, 3).notNullable().alter();
      table.decimal('maximum_discount_percentage', 10, 3).notNullable().alter();
      table.decimal('maximum_discount_value', 10, 3).notNullable().alter();
      table.decimal('price', 10, 3).notNullable().alter();
      table.decimal('cost_price', 10, 3).notNullable().alter();
      table.decimal('profit_margin', 10, 3).notNullable().alter();
    });
  }
}
