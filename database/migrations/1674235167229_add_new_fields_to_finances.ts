import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'finances';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('acquirer_id').references('tef_acquirers.id');
      table.uuid('tef_flag_id').references('tef_flags.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('acquirer_id');
      table.dropColumn('tef_flag_id');
    });
  }
}
