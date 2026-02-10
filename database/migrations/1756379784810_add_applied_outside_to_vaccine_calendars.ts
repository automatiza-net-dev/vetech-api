import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "vaccine_calendars";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean("applied_outside").defaultTo(false);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("applied_outside");
    });
  }
}
