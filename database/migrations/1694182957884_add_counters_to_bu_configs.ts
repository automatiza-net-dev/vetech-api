import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_configs';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.bigint('bill_counter').defaultTo(0);
      table.bigint('budget_counter').defaultTo(0);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('bill_counter');
      table.dropColumn('budget_counter');
    });
  }
}
