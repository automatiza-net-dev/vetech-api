import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'finance_reversals';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('banking_id').references('bankings.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('banking_id');
    });
  }
}
