import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_configs';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.text('xml_download_authorization').defaultTo('');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('xml_download_authorization');
    });
  }
}
