import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_configs';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('focus_homologation_token');
      table.string('focus_production_token');
      table.string('fiscal_document_environment');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('focus_homologation_token');
      table.dropColumn('focus_production_token');
      table.dropColumn('fiscal_document_environment');
    });
  }
}
