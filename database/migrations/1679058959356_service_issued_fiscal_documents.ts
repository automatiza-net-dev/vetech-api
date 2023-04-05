import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'service_issued_fiscal_documents';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('bill_id').references('bills.id');
      table.uuid('bill_item_id').references('bill_items.id');
      table
        .uuid('fiscal_document_id')
        .references('business_unit_fiscal_documents.id');
      table.uuid('user_who_authorized_id').references('users.id');
      table.uuid('user_who_cancelled_id').references('users.id');

      table.string('model');
      table.integer('sequence');
      table.integer('rps_number');
      table.integer('rps_series');
      table.string('rps_type');
      table.string('verification_code');
      table.json('errors');

      table.dateTime('authorization_date');
      table.text('authorization_receipt');

      table.dateTime('cancellation_date');
      table.dateTime('cancellation_receipt_date');
      table.text('cancellation_reason');

      table.text('mirror_path');
      table.text('authorization_xml_path');
      table.text('authorization_pdf_path');
      table.string('status');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.timestamp('deleted_at', { useTz: true }).defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
