import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'exams';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('type').defaultTo('');
      table.boolean('own_laboratory').defaultTo(false);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('type');
      table.dropColumn('own_laboratory');
    });
  }
}
