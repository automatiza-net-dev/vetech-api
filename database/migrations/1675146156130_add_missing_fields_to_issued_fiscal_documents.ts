import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'issued_fiscal_documents';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('bill_id').references('bills.id');

      table.dateTime('authorization_receipt_date');

      table.string('sefaz_status_code');
      table.string('sefaz_status');
      table.text('sefaz_message');
      table.text('authorization_xml_path');
      table.text('authorization_pdf_path');
      table.text('cancellation_xml_path');
      table.text('disabling_xml_path');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('bill_id');

      table.dropColumn('authorization_receipt_date');

      table.dropColumn('sefaz_status_code');
      table.dropColumn('sefaz_status');
      table.dropColumn('sefaz_message');
      table.dropColumn('authorization_xml_path');
      table.dropColumn('authorization_pdf_path');
      table.dropColumn('cancellation_xml_path');
      table.dropColumn('disabling_xml_path');
    });
  }
}
