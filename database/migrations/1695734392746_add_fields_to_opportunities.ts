import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunities';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('race_id').references('id').inTable('races');
      table.string('gender');
      table.float('weight');
      table.boolean('castrated');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('race_id');
      table.dropColumn('gender');
      table.dropColumn('weight');
      table.dropColumn('castrated');
    });
  }
}
