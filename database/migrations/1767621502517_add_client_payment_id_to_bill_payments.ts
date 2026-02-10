import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "bill_payments";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer("client_payment_id").unsigned().references("id").inTable("client_payments");
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("client_payment_id");
    });
  }
}
