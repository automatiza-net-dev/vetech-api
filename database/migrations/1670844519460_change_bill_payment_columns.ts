import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_payments';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      // change column type to float
      table.float('total_value').alter();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.integer('total_value');
    });
  }
}
