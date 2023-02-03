import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_items';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('pis_cst');
      table.string('cofins_cst');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('pis_cst');
      table.dropColumn('cofins_cst');
    });
  }
}
