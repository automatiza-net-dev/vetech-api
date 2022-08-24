import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'pathologies';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.text('template').nullable();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('template');
    });
  }
}
