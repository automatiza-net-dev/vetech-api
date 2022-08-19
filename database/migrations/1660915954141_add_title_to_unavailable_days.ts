import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'unavailable_days';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('title').defaultTo('');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('title');
    });
  }
}
