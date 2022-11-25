import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bills';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('client_id').references('patients.id');
      table.uuid('user_id').references('users.id');
      table.uuid('seller_id').references('users.id');
      table.uuid('daily_movement_id').references('daily_movements.id');
      table.uuid('daily_cashier_id').references('daily_cashiers.id');
      table.uuid('budget_id').references('budgets.id');
      table.uuid('cancellation_user_id').references('users.id');
      table.uuid('cancellation_reason_id').references('reasons.id');

      table.datetime('bill_date');
      table.float('product_value');
      table.float('service_value');
      table.float('discount_value');
      table.float('fee_value');
      table.float('delivery_value');
      table.float('total_value');
      table.float('icms_base');
      table.float('icms_value');
      table.float('icms_st_base');
      table.float('icms_st_value');
      table.float('iss_base');
      table.float('iss_value');
      table.float('pis_base');
      table.float('pis_value');
      table.float('pis_retention_value');
      table.float('cofins_base');
      table.float('cofins_value');
      table.float('cofins_retention_value');
      table.float('ipi_base');
      table.float('ipi_value');
      table.float('icms_deferred_value');
      table.float('icms_fcp_value');
      table.float('icms_uf_origin_value');
      table.float('icms_uf_destination_value');
      table.float('other_value');
      table.text('additional_information');
      table.datetime('cancelled_at');
      table.text('cancellation_observation');
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
