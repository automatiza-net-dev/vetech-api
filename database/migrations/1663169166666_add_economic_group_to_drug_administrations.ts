import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'drug_administrations';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('economic_group_id').references('economic_groups.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('economic_group_id');
    });
  }
}
