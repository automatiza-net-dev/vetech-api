import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'issued_fiscal_documents';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('user_who_authorized_id').references('users.id');
      table.uuid('user_who_cancelled_id').references('users.id');
      table.uuid('user_who_disabled_id').references('users.id');
      table.uuid('user_who_did_contingency_id').references('users.id');

      table.string('movement_type');
      table.string('model');
      table.string('series');
      table.integer('sequence');
      table.string('purpose');
      table.text('access_key');
      table.text('access_key_ref');

      table.dateTime('authorization_date');
      table.text('authorization_receipt');

      table.dateTime('cancellation_date');
      table.text('cancellation_receipt');
      table.dateTime('cancellation_receipt_date');
      table.text('cancellation_reason');

      table.dateTime('disabling_date');
      table.text('disabling_receipt');
      table.dateTime('disabling_receipt_date');
      table.text('disabling_reason');

      table.string('contingency');
      table.dateTime('contingency_date');
      table.text('contingency_reason');
      table.dateTime('contingency_delivery_date');

      table.boolean('active').defaultTo(true);
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.timestamp('deleted_at', { useTz: true }).defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
