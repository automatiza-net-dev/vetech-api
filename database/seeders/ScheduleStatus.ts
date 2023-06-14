import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ScheduleStatus, {
  SS_ATTENDANCE_CANCELLED,
  SS_ATTENDANCE_FINISHED,
  SS_CONFIRMED,
  SS_HOSPITALIZED,
  SS_LATE,
  SS_NOT_CONFIRMED,
  SS_ON_ATTENDANCE,
  SS_ON_NOTE,
  SS_RECEPTION,
  SS_SURGERY,
} from 'App/Models/ScheduleStatus';

export default class extends BaseSeeder {
  private BASE: Array<Partial<ScheduleStatus>> = [
    {
      id: SS_NOT_CONFIRMED,
      description: 'Agendado (Não confirmado)',
      color: '#000',
      type: 'AN',
    },
    {
      id: SS_CONFIRMED,
      description: 'Agendado (Confirmado)',
      color: '#000',
      type: 'AC',
    },
    {
      id: SS_RECEPTION,
      description: 'Na recepção',
      color: '#000',
      type: 'REC',
    },
    {
      id: SS_ON_ATTENDANCE,
      description: 'Em atendimento',
      color: '#000',
      type: 'ATEND',
    },
    {
      id: SS_ATTENDANCE_FINISHED,
      description: 'Atendimento finalizado',
      color: '#000',
      type: 'FIN',
    },
    {
      id: SS_ATTENDANCE_CANCELLED,
      description: 'Atendimento cancelado',
      color: '#000',
      type: 'CANC',
    },
    {
      id: SS_SURGERY,
      description: 'Em cirurgia',
      color: '#000',
      type: 'CIR',
    },
    {
      id: SS_HOSPITALIZED,
      description: 'Hospitalizado',
      color: '#000',
      type: 'INT',
    },
    {
      id: SS_ON_NOTE,
      description: 'Em observação',
      color: '#000',
      type: 'OBS',
    },
    {
      id: SS_LATE,
      description: 'Atrasado',
      color: '#000',
      type: 'ATR',
    },
  ];

  public async run() {
    await ScheduleStatus.fetchOrCreateMany('id', this.BASE);
  }
}
