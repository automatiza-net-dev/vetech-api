import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunity_activities';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .integer('activity_id')
        .unsigned()
        .references('id')
        .inTable('activities')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('activity_id');
    });
  }
}
