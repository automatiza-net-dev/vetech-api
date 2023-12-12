import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'client_origins';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('group').nullable();
      table.boolean('default').defaultTo(false);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('group');
      table.dropColumn('default');
    });
  }
}
