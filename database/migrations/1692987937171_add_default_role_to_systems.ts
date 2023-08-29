import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'systems';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.integer('default_role_id').references('id').inTable('roles');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('default_role_id');
    });
  }
}
