import { inject } from '@adonisjs/fold';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';

// U = error payload
type TypedAxiosError<U = unknown, T = unknown> = AxiosError<U, T>;

interface ISendNfe {
  issuedAt: string;
  purpose: string;
  cnpj: string;
  ie: string;
  seller: {
    location: {
      street: string; // rua, av, etc
      number: string;
      district: string;
      city: string;
      uf: string;
      code: string;
    };
  };
  buyer: {
    name: string;
    document: string;
    phone: string;
    location: {
      street: string; // rua, av, etc
      number: string;
      district: string;
      city: string;
      uf: string;
      code: string;
    };
  };
  values: {
    base_icms: string;
    icms_value: string;
    icms_base: string;
    icms_total_value: string;

    ipi: string;
    pis: string;
    cofins: string;

    product: string;
    delivery: string;
    discount: string;
    total: string;
    other: string;
  };
  items: Array<{
    index: string;
    code: string;
    description: string;
    cfop: string;
    quantity: string;
    value: string;
    total: string;
    unity: string;
    ncm: string;

    icms_origin: string;
    icms_base: string;
    icms_total_value: string;
    icms_base_st: string;
    icms_total_value_st: string;

    cst_icms: string;
    cst_pis: string;
    cst_cofins: string;
  }>;
}

const nfeResponseSchema = z.object({
  status: z.enum([
    'processando_autorizacao',
    'autorizado',
    'cancelado',
    'erro_autorizacao',
    'denegado',
  ]),
  status_sefaz: z.string(),
  mensagem_sefaz: z.string(),
  serie: z.string().optional(),
  numero: z.string().optional(),
  cnpj_emitente: z.string(),
  ref: z.string(),
  chave_nfe: z.string().optional(),
  caminho_xml_nota_fiscal: z.string().optional(),
  caminho_danfe: z.string().optional(),
  caminho_xml_carta_correcao: z.string().optional(),
  caminho_pdf_carta_correcao: z.string().optional(),
  numero_carta_correcao: z.string().optional(),
  caminho_xml_cancelamento: z.string().optional(),

  requisicao_nota_fiscal: z.string(),
  protocolo_nota_fiscal: z.string(),
  requisicao_cancelamento: z.string(),
  protocolo_cancelamento: z.string(),
  requisicao_carta_correcao: z.string(),
  protocolo_carta_correcao: z.string(),
});

@inject()
export default class FocusNfeService {
  private ax = axios.create({
    baseURL: process.env.FOCUS_NFE_URL,
    headers: {},
    auth: {
      username: process.env.FOCUS_NFE_KEY ?? '',
      password: '',
    },
  });

  public async sendNfe(ref: string, data: ISendNfe): Promise<unknown | null> {
    const payload = {
      natureza_operacao: 'Venda',
      data_emissao: data.issuedAt,
      data_entrada_saida: '2018-03-21T11:00:00', // TODO check
      tipo_documento: '1',
      local_destino: '1', // doc
      finalidade_emissao: data.purpose,
      consumidor_final: '1',
      presença_comprador: '1',

      cnpj_emitente: data.cnpj,
      inscricao_estadual_emitente: data.ie,
      // nome_emitente: 'ACME LTDA', // TODO check
      // nome_fantasia_emitente: 'ACME LTDA', // TODO check
      nome_emitente: 'ACME LTDA',
      nome_fantasia_emitente: 'ACME LTDA',
      logradouro_emitente: data.seller.location.street,
      numero_emitente: data.seller.location.number,
      bairro_emitente: data.seller.location.district,
      municipio_emitente: data.seller.location.city,
      // regime_tributario_emitente: '', // TODO check
      uf_emitente: data.seller.location.uf,
      cep_emitente: data.seller.location.code,

      nome_destinatario: data.buyer.name,
      cpf_destinatario: data.buyer.document,
      inscrição_estadual_destinatario: data.buyer.document,
      telefone_destinatario: data.buyer.phone,
      logradouro_destinatario: data.buyer.location.street,
      numero_destinatario: data.buyer.location.number,
      bairro_destinatario: data.buyer.location.district,
      municipio_destinatario: data.buyer.location.city,
      uf_destinatario: data.buyer.location.uf,
      indicador_inscricao_estadual_destinatario: '9',
      pais_destinatario: 'Brasil',
      cep_destinatario: data.buyer.location.code,

      icms_base_calculo: data.values.base_icms,
      icms_valor_: data.values.icms_value,
      icms_base_calculo_st: data.values.icms_base,
      icms_valor_total_st: data.values.icms_total_value,

      valor_frete: data.values.delivery,
      valor_seguro: '0',
      valor_desconto: data.values.discount,
      valor_total: data.values.total,
      valor_produtos: data.values.product,
      modalidade_frete: '9',

      valor_ipi: data.values.ipi,
      valor_pis: data.values.pis,
      valor_cofins: data.values.cofins,
      valor_outras_despesas: data.values.other,

      items: data.items.map(item => ({
        numero_item: item.index,
        codigo_produto: item.code,
        descricao: item.description,
        cfop: item.cfop,

        quantidade_comercial: item.quantity,
        quantidade_tributavel: item.quantity,

        valor_unitario_comercial: item.value,
        valor_unitario_tributavel: item.value,

        unidade_comercial: item.unity,
        unidade_tributavel: item.unity,

        codigo_ncm: item.ncm,
        inclui_no_total: '1',
        valor_bruto: item.total,
        icms_origem: item.icms_origin,
        icms_base_calculo: item.icms_base,
        icms_valor_total: item.icms_total_value,
        icms_base_calculo_st: item.icms_base_st,
        icms_valor_total_st: item.icms_total_value_st,

        icms_situacao_tributaria: item.cst_icms,
        pis_situacao_tributaria: item.cst_pis,
        cofins_situacao_tributaria: item.cst_cofins,
      })),
    };

    try {
      await this.ax.post(`/v2/nfe?ref=${ref}`, payload);

      return null;
    } catch (error) {
      type T = TypedAxiosError<{ mensagem: string }, unknown>;
      return (error as T).response?.data?.mensagem ?? '';
    }
  }

  public async getNfe(ref: string, complete = true): Promise<unknown | null> {
    try {
      const { data } = await this.ax.get(`/v2/nfe/${ref}`, {
        params: {
          completa: complete ? 1 : 0,
        },
      });

      console.log({ data });
      return 1;
    } catch (error) {
      console.log((error as AxiosError).response?.data);
      return null;
    }
  }

  public async cancel(ref: string, reason: string) {
    // TODO something
  }

  public async disable(ref: string, reason: string) {
    // TODO something
  }
}
