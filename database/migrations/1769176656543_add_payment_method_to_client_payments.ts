import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "client_payments";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid("payment_method_id").references("payment_methods.id").onDelete("SET NULL");
      table.integer("installments").defaultTo(1);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("payment_method_id");
      table.dropColumn("installments");
    });
  }
}
