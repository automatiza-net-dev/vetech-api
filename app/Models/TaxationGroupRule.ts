import {
  BaseModel,
  beforeFetch,
  beforeFind,
  belongsTo,
  BelongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import TaxationGroup from 'App/Models/TaxationGroup';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum CompanyType {
  'S' = 'SIMPLES',
  'N' = 'NAO_SIMPLES',
}

export enum MovementType {
  'E' = 'ENTRADA',
  'S' = 'SAIDA',
}

export enum MovementCategory {
  'NE' = 'NOTA_ENTRADA',
  'DE' = 'DEVOLUCAO_ENTRADA',
  'TE' = 'TRANSFERENCIA_ENTRADA',
  'OE' = 'OUTROS_ENTRADAS',
  'NS' = 'NOTA_SAIDA',
  'DS' = 'DEVOLUCAO_SAIDA',
  'TS' = 'TRANSFERENCIA_SAIDA',
  'OS' = 'OUTROS_SAIDAS',
}

export const ICMS_CST_SIMPLES = [
  '00',
  '10',
  '20',
  '30',
  '40',
  '41',
  '50',
  '51',
  '60',
  '70',
  '90',
] as const;

export const ICMS_CST_NAO_SIMPLES = [
  '101',
  '102',
  '103',
  '201',
  '202',
  '203',
  '300',
  '400',
  '500',
  '900',
] as const;

export const IPI_CST = [
  '00',
  '01',
  '02',
  '03',
  '04',
  '05',
  '49',
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '99',
] as const;

export const PIS_CST__COFINS_CST = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '49',
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '60',
  '61',
  '62',
  '63',
  '64',
  '65',
  '66',
  '67',
  '70',
  '71',
  '72',
  '73',
  '74',
  '75',
  '98',
  '99',
] as const;

export default class TaxationGroupRule extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column({
    columnName: 'company_type',
  })
  public companyType: CompanyType;

  @column({
    columnName: 'movement_type',
  })
  public movementType: MovementType;

  @column({
    columnName: 'movement_category',
  })
  public movementCategory: MovementCategory;

  @column({
    columnName: 'from_uf',
  })
  public fromUf: string;

  @column({
    columnName: 'to_uf',
  })
  public toUf: string;

  // @column({
  //   columnName: 'cod_operacao_fiscal',
  // })
  // public codOperacaoFiscal: string;

  @column({
    columnName: 'icms_cst',
  })
  public icmsCst: typeof ICMS_CST_SIMPLES[number];

  @column({
    columnName: 'icms_perc',
  })
  public icmsPerc: number;

  @column({
    columnName: 'icms_perc_red_aliquota',
  })
  public icmsPercRedAliquota: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime;

  @beforeFind()
  public static softDeletesFind = softDeleteQuery;

  @beforeFetch()
  public static softDeletesFetch = softDeleteQuery;

  public async softDelete(column?: string) {
    await softDelete(this, column);
  }

  @column({
    serializeAs: null,
  })
  public taxation_group_id: string;

  @belongsTo(() => TaxationGroup, {
    foreignKey: 'taxation_group_id',
  })
  public taxationGroup: BelongsTo<typeof TaxationGroup>;
}
