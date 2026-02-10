import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "productivity_item_products";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("order").unsigned().defaultTo(99);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("order");
    });
  }
}
