import { inject } from '@adonisjs/fold';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';

// U = error payload
type TypedAxiosError<U = unknown, T = unknown> = AxiosError<U, T>;

export interface ISendNfe {
  nfe_series: string;
  nfe_number: number;
  issuedAt: string;
  authorizedAt: string;
  purpose: string;

  seller: {
    name: string | undefined;
    fantasy_name: string | undefined;
    phone: string | undefined;
    cnpj: string | undefined;
    state_ie: string | undefined;
    city_ie: string | undefined;
    cnae: string | undefined;
    regime: string;

    location: {
      street: string; // rua, av, etc
      number: string;
      district: string;
      city: string;
      uf: string;
      code: string;
      complement: string;
    };
  };
  buyer: {
    name: string;
    cpf_document: string | null;
    cnpj_document: string | null;
    phone: string;
    email: string;
    ie: string;
    authorized: string;
    location: {
      street: string; // rua, av, etc
      number: string;
      district: string;
      city: string;
      uf: string;
      code: string;
      complement: string | null;
    };
  };

  items: Array<
    Partial<{
      index: string;
      code: string;
      barcode: string;
      description: string;
      ncm: string;
      cest: string;
      tax_benefit_code: string | null;
      cfop: string;
      quantity: string;
      value: string;
      unity: string;

      discount: number;

      cst_icms: string;
      icms_red_calc: number;
      icms_percentage: number;
      icms_value: number;
      icms_modality: number;
      icms_origin: string;
      icms_base: number;

      icms_st_modality: number;
      icms_st_additional: number;
      icms_st_red_calc: number;
      icms_st_base: number;
      icms_st_percentage: number;
      icms_st_value: number;

      fcp_percentage: number;
      fcp_base_calc: number;
      fcp_value: number;

      cst_ipi: string | null;
      ipi_base: number | null;
      ipi_percentage: number | null;
      ipi_value: number | null;

      cst_pis: string;
      pis_base: number;
      pis_percentage: number;
      pis_value: number;

      cst_cofins: string;
      cofins_base: number;
      cofins_percentage: number;
      cofins_value: number;
    }>
  >;

  payments: Array<{
    nfe_code: string;
    description: string | null;
    installment: number;
    integration_type: '1' | '2' | null;
    acquirer: string | null | undefined;
    flag: string;
    nsu: string;
  }>;

  totalizers: {
    icms_base: number;
    icms_total: number;
    fcp_total: number;
    product_value: number;
    delivery_value: number;
    discount_value: number;
    ipi_value: number;
    pis_value: number;
    cofins_value: number;
    other_value: number;
  };
}

interface IDisableNfe {
  cnpj: string;
  series: string;
  sequence: string;
  reason: string;
}

const nfeResponseSchema = z.object({
  cnpj_emitente: z.string(),
  ref: z.string(),
  status: z.enum([
    'processando_autorizacao',
    'autorizado',
    'cancelado',
    'erro_autorizacao',
    'denegado',
  ]),
  status_sefaz: z.string(),
  mensagem_sefaz: z.string(),
  chave_nfe: z.string().optional(),
  numero: z.string().optional(),
  serie: z.string().optional(),
  protocolo: z.string().optional(), // check
  caminho_xml_nota_fiscal: z.string().optional(),
  caminho_danfe: z.string().optional(),
  caminho_xml_carta_correcao: z.string().optional(),
  caminho_pdf_carta_correcao: z.string().optional(),
  numero_carta_correcao: z.string().optional(),
  caminho_xml_cancelamento: z.string().optional(),

  protocolo_nota_fiscal: z.optional(
    z.object({
      versao: z.string(),
      ambiente: z.string(),
      versao_aplicativo: z.string(),
      chave_nfe: z.string(),
      data_recebimento: z.string(),
      numero_protocolo: z.string(),
      digest_value: z.string(),
      status: z.string(),
      motivo: z.string(),
    }),
  ),
  requisicao_cancelamento: z.optional(
    z.object({
      versao: z.string(),
      ambiente: z.string(),
      versao_aplicativo: z.string(),
      codigo_orgao: z.string(),
      status: z.string(),
      motivo: z.string(),
      chave_nfe: z.string(),
      tipo_evento: z.string(),
      descricao_evento: z.string(),
      data_evento: z.string(),
      numero_protocolo: z.string(),
    }),
  ),
  protocolo_cancelamento: z.optional(
    z.object({
      versao: z.string(),
      ambiente: z.string(),
      versao_aplicativo: z.string(),
      codigo_orgao: z.string(),
      status: z.string(),
      motivo: z.string(),
      chave_nfe: z.string(),
      tipo_evento: z.string(),
      descricao_evento: z.string(),
      data_evento: z.string(),
      numero_protocolo: z.string(),
    }),
  ),
  requisicao_carta_correcao: z.optional(
    z.object({
      versao: z.string(),
      id_tag: z.string(),
      codigo_orgao: z.string(),
      ambiente: z.string(),
      cnpj: z.string(),
      chave_nfe: z.string(),
      data_evento: z.string(),
      tipo_evento: z.string(),
      numero_sequencial_evento: z.string(),
      versao_evento: z.string(),
      descricao_evento: z.string(),
      correcao: z.string(),
      condicoes_uso: z.string(),
    }),
  ),
  protocolo_carta_correcao: z.optional(
    z.object({
      versao: z.string(),
      ambiente: z.string(),
      versao_aplicativo: z.string(),
      codigo_orgao: z.string(),
      status: z.string(),
      motivo: z.string(),
      chave_nfe: z.string(),
      tipo_evento: z.string(),
      descricao_evento: z.string(),
      data_evento: z.string(),
      numero_protocolo: z.string(),
    }),
  ),
});

const cancelNfeResponseSchema = z.object({
  status_sefaz: z.string(),
  mensagem_sefaz: z.string(),
  status: z.string(),
  caminho_xml_cancelamento: z.string(),
});

const disableNfeResponseSchema = z.object({
  status_sefaz: z.string(),
  mensagem_sefaz: z.string(),
  serie: z.string(),
  numero_inicial: z.string(),
  numero_final: z.string(),
  modelo: z.string(),
  cnpj: z.string(),
  status: z.string(),
  caminho_xml: z.string(),
  protocolo_sefaz: z.string(),
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

  public async sendNfe(ref: string, data: ISendNfe): Promise<string | null> {
    const payload = {
      natureza_operacao: 'Venda',
      // serie: data.nfe_series, // THIS
      numero: data.nfe_number,
      data_emissao: data.issuedAt,
      data_entrada_saida: data.authorizedAt,
      tipo_documento: '1',
      local_destino: '1', // doc
      finalidade_emissao: '1',
      consumidor_final: '1',
      presenca_comprador: '1',
      indicador_intermediario: '0',

      cnpj_emitente: data.seller.cnpj,
      nome_emitente: data.seller.name,
      nome_fantasia_emitente: data.seller.fantasy_name,
      logradouro_emitente: data.seller.location.street,
      numero_emitente: data.seller.location.number,
      complemento_emitente: data.seller.location.complement,
      bairro_emitente: data.seller.location.district,
      municipio_emitente: data.seller.location.city,
      uf_emitente: data.seller.location.uf,
      cep_emitente: data.seller.location.code,
      telefone_emitente: data.seller.phone,
      inscricao_estadual_emitente: data.seller.state_ie,
      inscricao_municipal_emitente: data.seller.city_ie,
      cnae_fiscal_emitente: data.seller.cnae,
      regime_tributario_emitente: data.seller.regime,

      nome_destinatario: data.buyer.name,
      // cnpj_destinatario: 'data.buyer.cnpj_document',
      cpf_destinatario: data.buyer.cpf_document,
      logradouro_destinatario: data.buyer.location.street,
      numero_destinatario: data.buyer.location.number,
      complemento_destinatario: data.buyer.location.complement,
      bairro_destinatario: data.buyer.location.district,
      municipio_destinatario: data.buyer.location.city,
      uf_destinatario: data.buyer.location.uf,
      cep_destinatario: data.buyer.location.code,
      telefone_destinatario: data.buyer.phone,
      inscricao_estadual_destinatario: data.buyer.ie,
      indicador_inscricao_estadual_destinatario: '9',
      email_destinatario: data.buyer.email,
      pessoas_autorizadas: [], // THIS// THIS// THIS// THIS// THIS// THIS// THIS// THIS// THIS// THIS// THIS

      itens: data.items.map(item => ({
        numero_item: item.index,
        codigo_produto: item.code,
        codigo_barras_comercial: item.barcode,
        descricao: item.description,
        codigo_ncm: item.ncm,
        cest: item.cest,
        codigo_beneficio_fiscal: item.tax_benefit_code,
        cfop: item.cfop,
        unidade_comercial: item.unity,
        quantidade_comercial: item.quantity,
        valor_unitario_comercial: item.value,
        valor_desconto: item.discount,
        inclui_no_total: '1',

        icms_origem: item.icms_origin,
        icms_situacao_tributaria: item.cst_icms,
        icms_modalidade_base_calculo: item.icms_modality,
        icms_base_calculo: item.icms_base,
        icms_reducao_base_calculo: item.icms_red_calc,
        icms_aliquota: item.icms_percentage,
        icms_valor: item.icms_value,

        icms_modalidade_base_calculo_st: item.icms_st_modality,
        icms_margem_valor_adicionado_st: item.icms_st_additional,
        icms_reducao_base_calculo_st: item.icms_st_red_calc,
        icms_base_calculo_st: item.icms_st_base,
        icms_aliquota_st: item.icms_st_percentage,
        icms_valor_st: item.icms_st_value,

        fcp_percentual: item.fcp_percentage,
        fcp_base_calculo: item.icms_base,
        fcp_valor: item.fcp_value,

        ipi_situacao_tributaria: item.cst_ipi,
        ipi_base_calculo: item.ipi_base,
        ipi_aliquota: item.ipi_percentage,
        ipi_valor: item.ipi_value,

        pis_situacao_tributaria: item.cst_pis,
        pis_base_calculo: item.pis_base,
        pis_aliquota_porcentual: item.pis_percentage,
        pis_valor: item.pis_value,

        cofins_situacao_tributaria: item.cst_cofins,
        cofins_base_calculo: item.cofins_base,
        cofins_aliquota_porcentual: item.cofins_percentage,
        cofins_valor: item.cofins_value,
      })),

      formas_pagamento: data.payments.map(payment => ({
        forma_pagamento: payment.nfe_code,
        descricao_pagamento: payment.description,
        valor_pagamento: payment.installment,
        tipo_integracao: payment.integration_type,
        cnpj_credenciadora: payment.acquirer,
        bandeira_operadora: payment.flag,
        numero_autorizacao: payment.nsu,
      })),

      icms_base_calculo: data.totalizers.icms_base,
      icms_valor_total: data.totalizers.icms_total,
      valor_produtos: data.totalizers.product_value,
      valor_frete: data.totalizers.delivery_value,
      valor_seguro: 0,
      valor_desconto: data.totalizers.discount_value,
      valor_ipi: data.totalizers.ipi_value,
      valor_pis: data.totalizers.pis_value,
      cofins_value: data.totalizers.cofins_value,
      valor_outras_despesas: data.totalizers.other_value,
      modalidade_frete: '9',
    };

    console.log(payload); // THIS

    try {
      await this.ax.post(`/v2/nfe?ref=${ref}`, payload);

      return null;
    } catch (error) {
      console.log(error.response.data);

      type T = TypedAxiosError<{ mensagem: string }, unknown>;
      return (error as T).response?.data?.mensagem ?? '';
    }
  }

  public async getNfe(
    ref: string,
    complete = true,
  ): Promise<z.infer<typeof nfeResponseSchema> | null> {
    try {
      const { data } = await this.ax.get(`/v2/nfe/${ref}`, {
        params: {
          completa: complete ? 1 : 0,
        },
      });

      const zodResponse = nfeResponseSchema.safeParse(data);
      if (!zodResponse.success) {
        console.log('invalid schema');
        return null;
      }

      return zodResponse.data;
    } catch (error) {
      type T = TypedAxiosError<{ mensagem: string }, unknown>;
      console.log((error as T).response?.data);

      return null;
    }
  }

  // hora do evento?
  // https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360015591514-Rejei%C3%A7%C3%A3o-578-A-data-do-evento-n%C3%A3o-pode-ser-maior-que-a-data-do-processamento
  public async cancel(ref: string, reason: string) {
    try {
      const { data } = await this.ax.delete(`/v2/nfe/${ref}`, {
        data: {
          justificativa: reason,
        },
      });

      console.log({ data });

      const zodResponse = cancelNfeResponseSchema.safeParse(data);
      if (!zodResponse.success) {
        console.log('invalid schema');
        return null;
      }

      return zodResponse.data;
    } catch (error) {
      type T = TypedAxiosError<{ mensagem: string }, unknown>;
      console.log((error as T).response?.data);

      return null;
    }
  }

  // não é possível inutilizar nfe já autorizada
  // https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360015738793-Rejei%C3%A7%C3%A3o-241-Um-n%C3%BAmero-da-faixa-j%C3%A1-foi-utilizado
  public async disable(ref: string, disableData: IDisableNfe) {
    try {
      const { data } = await this.ax.delete(`/v2/nfe/${ref}`, {
        data: {
          cnpj: disableData.cnpj,
          serie: disableData.series,
          numero_inicial: disableData.sequence,
          numero_final: disableData.sequence,
          justificativa: disableData.reason,
        },
      });

      const zodResponse = disableNfeResponseSchema.safeParse(data);
      if (!zodResponse.success) {
        console.log('invalid schema');
        return null;
      }

      return zodResponse.data;
    } catch (error) {
      type T = TypedAxiosError<{ mensagem: string }, unknown>;
      console.log((error as T).response?.data);

      return null;
    }
  }
}
