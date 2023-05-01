import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_configs';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.boolean('requires_bill_patient').defaultTo(false);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('requires_bill_patient');
    });
  }
}
