import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_items';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('economic_group_id').references('economic_groups.id');
      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('bill_id').references('bills.id');
      table.uuid('product_variation_id').references('product_variations.id');
      table.uuid('tax_rule_id').references('taxation_group_rules.id');

      table.float('quantity');
      table.float('cost_value');
      table.float('sale_value');
      table.float('unitary_value');
      table.float('discount_value');
      table.float('total_value');
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
      table.float('pis_base');
      table.float('pis_percentage');
      table.float('pis_value');
      table.float('pis_retention_value');
      table.float('cofins_base');
      table.float('cofins_percentage');
      table.float('cofins_value');
      table.float('cofins_retention_value');
      table.float('ipi_base');
      table.float('ipi_percentage');
      table.float('ipi_value');
      table.float('ibpt_city_percentage');
      table.float('ibpt_state_percentage');
      table.float('ibpt_country_percentage');
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
