import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'budgets';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('daily_cashier_id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('daily_cashier_id').references('id').inTable('daily_cashiers');
    });
  }
}
