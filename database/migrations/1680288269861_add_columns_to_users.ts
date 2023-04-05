import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('inscription');
      table.dateTime('birth_date');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('inscription');
      table.dropColumn('birth_date');
    });
  }
}
