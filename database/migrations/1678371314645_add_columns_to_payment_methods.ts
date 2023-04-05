import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'payment_methods';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('nfe_code');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('nfe_code');
    });
  }
}
