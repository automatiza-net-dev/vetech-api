import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'daily_cashier_entries';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('payment_method_id')
        .nullable()
        .references('id')
        .inTable('payment_methods');

      table
        .uuid('account_plan_id')
        .nullable()
        .references('id')
        .inTable('account_plans');

      table.string('fiscal_note').nullable();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('payment_method_id');
      table.dropColumn('account_plan_id');
      table.dropColumn('fiscal_note');
    });
  }
}
