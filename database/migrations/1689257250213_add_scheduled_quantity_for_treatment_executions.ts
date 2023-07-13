import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'treatment_executions';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.integer('scheduled_quantity').notNullable().defaultTo(0);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('scheduled_quantity');
    });
  }
}
