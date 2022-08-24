import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedule_service_types';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('product_id').references('products.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('product_id');
    });
  }
}
