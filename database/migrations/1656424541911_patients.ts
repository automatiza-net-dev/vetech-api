import BaseSchema from '@ioc:Adonis/Lucid/Schema';
import { PatientGender, PatientType } from 'App/Models/Patient';

export default class extends BaseSchema {
  protected tableName = 'patients';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.string('name');
      table.enu('type', Object.values(PatientType), {
        useNative: true,
        enumName: 'patient_type',
        existingType: false,
      });
      table.string('photo').nullable();
      table.enu('gender', Object.values(PatientGender), {
        useNative: true,
        enumName: 'patient_gender',
        existingType: false,
      });
      table.text('tags').defaultTo('');
      table.date('birth_date');
      table.text('note').defaultTo('');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
