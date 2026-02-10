import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "patient_exams";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.date("requested_at");
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn("requested_at");
    });
  }
}
