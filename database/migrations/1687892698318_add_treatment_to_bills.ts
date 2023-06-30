import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bills';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .integer('treatment_id')
        .unsigned()
        .references('id')
        .inTable('treatments')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('treatment_id');
    });
  }
}
