import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedules';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.boolean('on_duty').defaultTo(false);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('on_duty');
    });
  }
}
