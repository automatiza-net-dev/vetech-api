import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'taxation_group_rules';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.decimal('icms_perc_red_base_calculo_st', 5, 2);
      table.decimal('icms_perc_diferimento', 5, 2);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('icms_perc_red_base_calculo_st');
      table.dropColumn('icms_perc_diferimento');
    });
  }
}
