import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "client_used_credits";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer("client_credit_id")
        .references("id")
        .inTable("client_credits")
        .nullable()
        .after("client_payment_id");
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("client_credit_id");
    });
  }
}
