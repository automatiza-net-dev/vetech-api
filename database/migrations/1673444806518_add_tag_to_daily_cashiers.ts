import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'daily_cashiers';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.integer('tag');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('tag');
    });
  }
}
