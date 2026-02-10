import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "client_payments";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table.uuid("user_id").references("id").inTable("users").notNullable();
      table.uuid("client_id").references("id").inTable("patients").notNullable();
      table.uuid("cashier_id").references("id").inTable("daily_cashiers").notNullable();
      table.uuid("movement_id").references("id").inTable("daily_movements").notNullable();

      table.decimal("value", 10, 2).notNullable();
      table.timestamp("payment_date", { useTz: true });

      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });
      table.timestamp("deleted_at", { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
