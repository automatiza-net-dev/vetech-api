import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_products';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.setNullable('cost_price');
      table.setNullable('profit_margin');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropNullable('cost_price');
      table.dropNullable('profit_margin');
    });
  }
}
