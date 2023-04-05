import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedules';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.dateTime('finished_at');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('finished_at');
    });
  }
}
