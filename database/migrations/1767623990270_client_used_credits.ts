import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "client_used_credits";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table.uuid("user_id").references("id").inTable("users").notNullable();
      table
        .uuid("reversed_by_user_id")
        .references("id")
        .inTable("users")
        .nullable();
      table
        .uuid("client_payment_id")
        .references("id")
        .inTable("client_payments")
        .notNullable();

      table.decimal("value_before", 10, 2).notNullable();
      table.decimal("used_value", 10, 2).notNullable();
      table.boolean("returned").defaultTo(false);

      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });
      table.timestamp("deleted_at", { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
