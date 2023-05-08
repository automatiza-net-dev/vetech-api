import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'finances';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('origin_id').references('bill_payments.id');

      table.dateTime('accepted_date').nullable();
      table.dateTime('conciliated_date').nullable();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('origin_id');

      table.dropColumn('accepted_date');
      table.dropColumn('conciliated_date');
    });
  }
}
