import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_configs';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('default_nfse_description');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('default_nfse_description');
    });
  }
}
