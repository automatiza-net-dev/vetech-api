import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalizations';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.text('complaint');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('complaint');
    });
  }
}
