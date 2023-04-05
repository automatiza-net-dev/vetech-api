import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalizations';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.dateTime('released_at');
      table.dateTime('death_at');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('released_at');
      table.dropColumn('death_at');
    });
  }
}
