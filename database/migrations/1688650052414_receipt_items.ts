import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'receipt_items';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.integer('receipt_id').references('receipts.id');
      table.uuid('product_variation_id').references('product_variations.id');
      table.uuid('disabled_user_id').references('users.id');

      table.float('quantity');
      table.float('cost_value');
      table.float('unitary_value');
      table.float('discount_value');
      table.float('total_value');
      table.datetime('issue_date');
      table.datetime('disabled_date');
      table.boolean('nfe_issued').defaultTo(false);
      table.string('status');

      table.string('fiscal_operation_code');
      table.string('fiscal_benefit_code');
      table.string('icms_origin_product');

      table.string('icms_cst');
      table.float('icms_base');
      table.float('icms_percentage');
      table.float('icms_value');
      table.float('icms_percentage_red_aliquot');
      table.float('icms_percentage_red_base');
      table.float('icms_deferred_value');
      table.float('icms_partition_value');
      table.float('icms_fcp_percentage');
      table.float('icms_fcp_value');
      table.float('icms_partition_origin_uf_percentage');
      table.float('icms_partition_destination_uf_percentage');
      table.float('icms_partition_inter_uf_percentage');
      table.float('icms_partition_origin_uf_value');
      table.float('icms_partition_destination_uf_value');
      table.float('icms_st_base');
      table.float('icms_st_percentage_red_base');
      table.float('icms_st_iva');
      table.float('icms_st_percentage_uf_destination');
      table.float('icms_st_value');

      table.string('iss_cst');
      table.float('iss_base');
      table.float('iss_percentage');
      table.float('iss_value');

      table.string('pis_cst');
      table.float('pis_base');
      table.float('pis_percentage');
      table.float('pis_value');
      table.float('pis_retention_value');

      table.string('cofins_cst');
      table.float('cofins_base');
      table.float('cofins_percentage');
      table.float('cofins_value');
      table.float('cofins_retention_value');

      table.string('ipi_cst');
      table.float('ipi_base');
      table.float('ipi_percentage');
      table.float('ipi_value');

      table.float('ibpt_city_percentage');
      table.float('ibpt_state_percentage');
      table.float('ibpt_country_percentage');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
