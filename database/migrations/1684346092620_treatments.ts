import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'treatments';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('bill_id').references('bills.id');
      table.uuid('emission_user_id').references('users.id');
      table.uuid('cancellation_user_id').references('users.id');
      table.uuid('cancellation_reason_id').references('reasons.id');
      table.uuid('seller_id').references('users.id');
      table.uuid('client_id').references('patients.id');

      table.dateTime('cancellation_date');
      table.text('observations');
      table.text('cancellation_observations');
      table.string('status');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
