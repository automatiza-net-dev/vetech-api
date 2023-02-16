import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'finances';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.integer('block');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('block');
    });
  }
}
