import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'budgets';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('bill_id').references('bills.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('bill_id');
    });
  }
}
