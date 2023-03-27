import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_payments';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('daily_cashier_id').references('daily_cashiers.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('daily_cashier_id');
    });
  }
}
