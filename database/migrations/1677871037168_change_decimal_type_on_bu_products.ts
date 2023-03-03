import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_products';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.decimal('commission', 10, 2).alter();
      table.decimal('meta', 10, 2).alter();
      table.decimal('commission_meta', 10, 2).alter();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.decimal('commission', 5, 2).alter();
      table.decimal('meta', 5, 2).alter();
      table.decimal('commission_meta', 5, 2).alter();
    });
  }
}
