import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class extends BaseSchema {
  protected tableName = "taxation_group_rules";

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("tributacao_iss").nullable();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string("tributacao_iss").nullable();
    });
  }
}
