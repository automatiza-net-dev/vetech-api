import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'account_plans';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .integer('account_plan_group_id')
        .references('account_plan_groups.id');
      table.uuid('parent_id').references('account_plans.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('account_plan_group_id');
      table.dropColumn('parent_id');
    });
  }
}
