import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_products';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.decimal('commission', 5, 2);
      table.string('meta_type');
      table.decimal('meta', 5, 2);
      table.decimal('commission_meta', 5, 2);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('commission');
      table.dropColumn('meta_type');
      table.dropColumn('meta');
      table.dropColumn('commission_meta');
    });
  }
}
