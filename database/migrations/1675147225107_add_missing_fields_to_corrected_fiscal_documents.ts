import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'corrected_fiscal_documents';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('correction_number');
      table.text('correction_xml_path');
      table.text('correction_pdf_path');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('correction_number');
      table.dropColumn('correction_xml_path');
      table.dropColumn('correction_pdf_path');
    });
  }
}
