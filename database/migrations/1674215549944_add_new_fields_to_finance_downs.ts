import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'finance_reversals';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('competence_date');
      table.string('fiscal_note');
      table.string('user_document');
      table.string('nsu_document');
      table.string('bar_code');
      table.string('bank');
      table.string('agency');
      table.string('account');
      table.uuid('acquirer_id').references('tef_acquirers.id');
      table.uuid('tef_flag_id').references('tef_flags.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('competence_date');
      table.dropColumn('fiscal_note');
      table.dropColumn('user_document');
      table.dropColumn('nsu_document');
      table.dropColumn('bar_code');
      table.dropColumn('bank');
      table.dropColumn('agency');
      table.dropColumn('account');
      table.dropColumn('acquirer_id');
      table.dropColumn('tef_flag_id');
    });
  }
}
