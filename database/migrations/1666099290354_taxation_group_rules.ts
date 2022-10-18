import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'taxation_group_rules';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('taxation_group_id').references('taxation_groups.id');
      table.uuid('tax_operation_id').references('tax_operations.id');

      table.string('company_type');
      table.string('movement_type');
      table.string('movement_category');
      table.string('from_uf');
      table.string('to_uf');
      table.string('icms_cst');
      table.decimal('icms_perc', 5, 2);
      table.decimal('icms_perc_red_aliquota', 5, 2);
      table.decimal('icms_perc_red_base_calculo', 5, 2);
      table.decimal('iva_icms_st', 5, 2);
      table.decimal('fcp_perc', 5, 2);
      table.string('tax_benefit_code');
      table.string('ipi_cst');
      table.decimal('ipi_perc', 5, 2);
      table.string('pis_cst');
      table.decimal('pis_perc', 5, 2);
      table.string('cofins_cst');
      table.decimal('cofins_perc', 5, 2);
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
