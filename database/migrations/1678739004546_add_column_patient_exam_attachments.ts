import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_exam_attachments';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('filename');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('filename');
    });
  }
}
