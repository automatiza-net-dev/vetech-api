import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "vaccine_calendar_logs";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");

      table.uuid("vaccine_calendar_id").references("vaccine_calendars.id").notNullable();
      table.uuid("application_user_id").references("users.id").notNullable();
      table.uuid("exclusion_user_id").references("users.id").notNullable();

      table.date("application_date");
      table.timestamp("created_at", { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
