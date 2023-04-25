import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'permissions';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.integer('screen_id').references('id').inTable('screens');

      table.dropColumn('name');

      table.string('control');
      table.string('description');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.string('name');

      table.dropColumn('screen_id');
      table.dropColumn('control');
      table.dropColumn('description');
    });
  }
}
