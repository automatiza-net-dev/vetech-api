import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'role_permissions';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.boolean('active').defaultTo(true);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('active');
    });
  }
}
