import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_configs';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('daily_cashier_type').defaultTo('usuario');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('daily_cashier_type');
    });
  }
}
