import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'products';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('group_id').references('groups.id');
      table.uuid('subgroup_id').references('subgroups.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('group_id');
      table.dropColumn('subgroup_id');
    });
  }
}
