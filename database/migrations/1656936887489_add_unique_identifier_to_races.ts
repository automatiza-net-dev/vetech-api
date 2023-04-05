import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'races';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('code').unique().defaultTo('');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('code');
    });
  }
}
