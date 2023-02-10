import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_configs';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table.uuid('business_unit_id').references('business_units.id');
      table.uuid('sale_exit_account_plan_id').references('account_plans.id');
      table.uuid('other_exit_account_plan_id').references('account_plans.id');
      table.uuid('order_entry_account_plan_id').references('account_plans.id');
      table.uuid('other_entry_account_plan_id').references('account_plans.id');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
