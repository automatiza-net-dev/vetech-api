import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'holder_dependents';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.boolean('is_main').defaultTo(false);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('is_main');
    });
  }
}
