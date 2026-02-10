import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "client_credits";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer("client_payment_id")
        .unsigned()
        .references("client_payments.id")
        .onDelete("SET NULL");
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("client_payment_id");
    });
  }
}
