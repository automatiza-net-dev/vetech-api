import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'product_variations';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.setNullable('barcode');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropNullable('barcode');
    });
  }
}
