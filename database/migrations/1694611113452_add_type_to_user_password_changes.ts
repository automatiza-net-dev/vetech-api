import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'user_password_changes';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('type').notNullable().defaultTo('change');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('type');
    });
  }
}
