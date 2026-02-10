import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableNames = ["productivity_items", "productivity_item_products"];

  public async up() {
    for (const tableName of this.tableNames) {
      this.schema.alterTable(tableName, (table) => {
        table.uuid("exclusion_user_id").references("users.id");
        table.timestamp("deleted_at", { useTz: true }).nullable();
      });
    }
  }

  public async down() {
    for (const tableName of this.tableNames) {
      this.schema.alterTable(tableName, (table) => {
        table.dropColumn("exclusion_user_id");
        table.dropColumn("deleted_at");
      });
    }
  }
}
