import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "patient_vaccines";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text("import_field").defaultTo("");
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("import_field");
    });
  }
}
