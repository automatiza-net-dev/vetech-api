import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'payment_method_flag_installments';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table.integer('installment');
      table.float('fee');

      table
        .uuid('payment_method_flag_id')
        .references('payment_method_flags.id');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
