import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_payments';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.float('payment_method_discount_percentage');
      table.float('payment_method_discount_value');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('payment_method_discount_percentage');
      table.dropColumn('payment_method_discount_value');
    });
  }
}
