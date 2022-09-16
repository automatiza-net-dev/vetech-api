import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'units';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('tag');
      table.string('type');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('tag');
      table.dropColumn('type');
    });
  }
}
