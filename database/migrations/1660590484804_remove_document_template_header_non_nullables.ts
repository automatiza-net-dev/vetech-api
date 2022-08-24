import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'document_templates';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.setNullable('header');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropNullable('header');
    });
  }
}
