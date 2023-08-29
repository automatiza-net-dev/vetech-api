import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedules';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .integer('opportunity_id')
        .references('id')
        .inTable('opportunities')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('opportunity_id');
    });
  }
}
