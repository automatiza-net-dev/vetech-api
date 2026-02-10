import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "borderos";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid("tef_acquirer_id").references("tef_acquirers.id");
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("tef_acquirer_id");
    });
  }
}
