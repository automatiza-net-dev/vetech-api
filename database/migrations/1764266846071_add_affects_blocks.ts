import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "payment_methods";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("open_installments_affects_block").defaultTo(false);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("open_installments_affects_block");
    });
  }
}
