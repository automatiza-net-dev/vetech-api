import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "bankings";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid("tef_flag_id").references("tef_flags.id");
      table.uuid("acquirer_id").references("tef_acquirers.id");
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("tef_flag_id");
      table.dropColumn("acquirer_id");
    });
  }
}
