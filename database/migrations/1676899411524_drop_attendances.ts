import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  public async up() {
    this.schema.dropTable('attendances');
    this.schema.dropTable('attendance_statuses');
  }

  public async down() {
    console.log('no down');
  }
}
