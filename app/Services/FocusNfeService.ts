import InternalErrorException from "App/Exceptions/InternalErrorException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import IssuedFiscalDocument from "App/Models/IssuedFiscalDocument";
import ServiceIssuedFiscalDocument from "App/Models/ServiceIssuedFiscalDocument";
import { inject } from "@adonisjs/fold";
import Logger from "@ioc:Adonis/Core/Logger";
import { TransactionClientContract } from "@ioc:Adonis/Lucid/Database";
import axios, { AxiosError } from "axios";
import format from "date-fns/format";
import { z } from "zod";

// U = error payload
type TypedAxiosError<U = unknown, T = unknown> = AxiosError<U, T>;

export interface ISendNfe {
	nfe_series: string;
	nfe_number: string;
	issuedAt: string;
	authorizedAt: string;
	purpose: string;
	finality: IssuedFiscalDocument["finality"];
	accessKeyRef: string | null;
	model: "65" | (string & {});
	additionalInformation: string | null;

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
		code: "1" | "2" | "9";
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
			icms_deferred_operation_value: number;
			icms_deferred_percentage: number;
			icms_deferred_value: number;

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
		integration_type: "1" | "2" | null;
		acquirer: string | null | undefined;
		flag: string;
		nsu: string | undefined;
	}>;

	totalizers: {
		// icms_base: number;
		// icms_total: number;
		// fcp_total: number;
		// product_value: number;
		delivery_value: number;
		// discount_value: number;
		// ipi_value: number;
		// pis_value: number;
		// cofins_value: number;
		other_value: number;
	};
}

export interface ISendNfse {
	issuedAt: string;
	simple: boolean;
	seller: {
		document: string;
		city_ie: string;
		city_code: string;
	};
	buyer: {
		cpf_document: string | null;
		cnpj_document: string | null;
		name: string;
		email: string;
		phone: string;
		address: {
			street: string | undefined; // rua, av, etc
			number: string | undefined;
			district: string | undefined;
			city_code: string | undefined;
			uf: string | undefined;
			postal_code: string | undefined;
			complement: string | undefined;
		};
	};
	service: {
		total_value: number;
		pis_value: number;
		cofins_value: number;
		iss_value: number;
		base_value: number;
		percentage_value: number;
		discount_value: number;
		service_code: string;
		cnae: string;
		description: string;
		city_code: string;
	};
}

interface IDisableNfe {
	cnpj: string;
	series: string;
	sequence: string;
	reason: string;
}

export interface ISendNationalNfse {
	issuedAt: string;
	competenceDate: string;

	seller: {
		document: string;
		municipalRegistration: string;
		cityCode: number;
		cityRegistration: string;
		simpleOptionCode: number;
		specialTaxRegime: number;
		regimeTributarySimplesNacional?: number;
		totalTaxPercentageSimplesNacional?: number;
	};

	buyer: {
		cpfDocument?: string;
		cnpjDocument?: string;
		name: string;
		email: string;
		phone: string;
		address: {
			street: string;
			number: string;
			complement?: string;
			district: string;
			cityCode: number;
			postalCode: string;
		};
	};

	service: {
		description: string;
		value: number;
		nationalServiceCode: string;
		nationalTaxationCode: string;
		issTaxationType: number;
		issRetentionType: number;
		cityCode: number;
	};
}

export const nfeResponseSchema = z.object({
	cnpj_emitente: z.string(),
	ref: z.string(),
	status: z.enum([
		"processando_autorizacao",
		"autorizado",
		"cancelado",
		"erro_autorizacao",
		"denegado",
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
			numero_protocolo: z.string().optional(),
			digest_value: z.string().optional(),
			status: z.string(),
			motivo: z.string(),
		}),
	),
	requisicao_cancelamento: z.optional(
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
			protocolo: z.string(),
			justificativa: z.string(),
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

export const createNfseResponseSchema = z.object({
	cnpj_prestador: z.string(),
	ref: z.string(),
	numero_rps: z.coerce.number(),
	serie_rps: z.union([z.number(), z.string()]),
	status: z.enum(["erro_autorizacao", "processando_autorizacao"]),
	erros: z.optional(z.array(z.any())),
});

export const nfseResponseSchema = z.object({
	status: z.enum([
		"autorizado",
		"cancelado",
		"erro_autorizacao",
		"processando_autorizacao",
		"substituido",
	]),
	cnpj_prestador: z.string(),
	ref: z.string(),
	numero: z.optional(z.coerce.number()),
	numero_rps: z.coerce.number(),
	serie_rps: z.union([z.number(), z.string()]),
	tipo_rps: z.optional(z.string()),
	erros: z.optional(z.array(z.any())),
	url: z.optional(z.string()),
	url_danfse: z.optional(z.string()),
	data_emissao: z.optional(z.coerce.date()),
	caminho_xml_nota_fiscal: z.optional(z.string()),
	codigo_verificacao: z.optional(z.string()),
	numero_nfse_substituida: z.optional(z.string()),
	numero_nfse_substituta: z.optional(z.string()),
});

// const cancelNfeResponseSchema = z.object({
//   status_sefaz: z.string(),
//   mensagem_sefaz: z.string(),
//   status: z.string(),
//   caminho_xml_cancelamento: z.string(),
// });

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

export const disableWebhookResponseSchema = z.object({
	status: z.enum(["autorizado", "erro_autorizacao"]),
	status_sefaz: z.string(),
	mensagem_sefaz: z.string(),
	serie: z.string(),
	numero_inicial: z.string(),
	numero_final: z.string(),
	modelo: z.string(),
	cnpj: z.string(),
	caminho_xml: z.string(),
	protocolo_sefaz: z.string(),
});

@inject()
export default class FocusNfeService {
	private ax = axios.create({
		baseURL: process.env.FOCUS_NFE_URL,
		headers: {},
	});

	public async sendNfe(ref: string, rawPayload: ISendNfe, token: string) {
		const payload = {
			natureza_operacao: rawPayload.finality === 4 ? "Devolução" : "Venda",
			// serie: data.nfe_series, // THIS
			numero: rawPayload.nfe_number,
			data_emissao: rawPayload.issuedAt,
			data_entrada_saida:
				rawPayload.model === "65" ? undefined : rawPayload.authorizedAt,
			tipo_documento: "1",
			local_destino: "1", // doc
			finalidade_emissao: rawPayload.finality.toString(),
			consumidor_final: "1",
			presenca_comprador: "1",
			indicador_intermediario: "0",

			notas_referenciadas: rawPayload.accessKeyRef
				? [{ chave_nfe: rawPayload.accessKeyRef }]
				: undefined,

			cnpj_emitente: rawPayload.seller.cnpj,
			nome_emitente: rawPayload.seller.name,
			nome_fantasia_emitente: rawPayload.seller.fantasy_name,
			logradouro_emitente: rawPayload.seller.location.street,
			numero_emitente: rawPayload.seller.location.number,
			complemento_emitente: rawPayload.seller.location.complement.substring(
				0,
				30,
			),
			bairro_emitente: rawPayload.seller.location.district,
			municipio_emitente: rawPayload.seller.location.city,
			uf_emitente: rawPayload.seller.location.uf,
			cep_emitente: rawPayload.seller.location.code,
			telefone_emitente: rawPayload.seller.phone,
			inscricao_estadual_emitente: rawPayload.seller.state_ie,
			inscricao_municipal_emitente: rawPayload.seller.city_ie,
			cnae_fiscal_emitente: rawPayload.seller.cnae,
			regime_tributario_emitente: rawPayload.seller.regime,

			nome_destinatario: rawPayload.buyer.name,
			cnpj_destinatario: rawPayload.buyer.cnpj_document,
			cpf_destinatario: rawPayload.buyer.cpf_document,
			logradouro_destinatario:
				rawPayload.model === "65"
					? undefined
					: rawPayload.buyer.location.street,
			numero_destinatario:
				rawPayload.model === "65"
					? undefined
					: rawPayload.buyer.location.number,
			complemento_destinatario:
				rawPayload.model === "65"
					? undefined
					: rawPayload.buyer.location.complement?.substring(0, 30),
			bairro_destinatario:
				rawPayload.model === "65"
					? undefined
					: rawPayload.buyer.location.district,
			municipio_destinatario:
				rawPayload.model === "65" ? undefined : rawPayload.buyer.location.city,
			uf_destinatario:
				rawPayload.model === "65" ? undefined : rawPayload.buyer.location.uf,
			cep_destinatario:
				rawPayload.model === "65" ? undefined : rawPayload.buyer.location.code,
			telefone_destinatario:
				rawPayload.model === "65" ? undefined : rawPayload.buyer.phone,
			inscricao_estadual_destinatario:
				rawPayload.buyer.code === "1" ? rawPayload.buyer.ie : undefined,
			indicador_inscricao_estadual_destinatario: rawPayload.buyer.code,
			email_destinatario: rawPayload.buyer.email,
			pessoas_autorizadas: [], // THIS// THIS// THIS// THIS// THIS// THIS// THIS// THIS// THIS// THIS// THIS

			itens: rawPayload.items.map((item) => ({
				numero_item: item.index,
				codigo_produto: item.code,
				codigo_barras_comercial: item.barcode,
				codigo_barras_tributavel: item.barcode,
				descricao: item.description,
				codigo_ncm: item.ncm,
				cest: item.cest,
				codigo_beneficio_fiscal: item.tax_benefit_code,
				cfop: item.cfop,
				unidade_comercial: item.unity,
				quantidade_comercial: item.quantity,
				valor_unitario_comercial: item.value,
				valor_desconto: item.discount,
				inclui_no_total: "1",

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
				icms_valor_operacao: item.icms_deferred_operation_value,
				icms_percentual_diferimento: item.icms_deferred_percentage,
				icms_valor_diferido: item.icms_deferred_value,

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

			formas_pagamento:
				rawPayload.finality === 1
					? rawPayload.payments.map((payment) => ({
							forma_pagamento: payment.nfe_code,
							descricao_pagamento: payment.description,
							valor_pagamento: payment.installment,
							tipo_integracao: payment.integration_type,
							cnpj_credenciadora: payment.acquirer,
							bandeira_operadora: payment.flag,
							numero_autorizacao: payment.nsu,
						}))
					: [{ forma_pagamento: "90" }],

			// icms_base_calculo: data.totalizers.icms_base,
			// icms_valor_total: data.totalizers.icms_total,
			// valor_produtos: data.totalizers.product_value,
			valor_frete: rawPayload.totalizers.delivery_value,
			valor_seguro: 0,
			// valor_desconto: data.totalizers.discount_value,
			// valor_ipi: data.totalizers.ipi_value,
			// valor_pis: data.totalizers.pis_value,
			// cofins_value: data.totalizers.cofins_value,
			valor_outras_despesas: rawPayload.totalizers.other_value,
			modalidade_frete: "9",

			informacoes_adicionais_contribuinte: rawPayload.additionalInformation,
		};

		if (payload.cpf_destinatario) {
			// @ts-expect-error Aqui vai ocorrer um erro, mas estou ignorando
			delete payload.cnpj_destinatario;
		}

		if (payload.cnpj_destinatario) {
			// @ts-expect-error Aqui vai ocorrer um erro, mas estou ignorando
			delete payload.cpf_destinatario;
		}

		// console.log(JSON.stringify(payload, null, 2)); // THIS

		try {
			const { data } = await this.ax.post(
				rawPayload.model === "65"
					? `/v2/nfce?ref=${ref}`
					: `/v2/nfe?ref=${ref}`,
				this.sanitize(payload),
				{
					auth: {
						username: token,
						password: "",
					},
				},
			);

			return {
				success: true as const,
				message: data.status as string,
				chave: "chave_nfe" in data ? (data.chave_nfe as string) : null,
				numero: "numero" in data ? (data.numero as string) : null,
			};
		} catch (error) {
			// Logger.error(error.response);

			type T = TypedAxiosError<{ mensagem: string }, unknown>;
			return {
				success: false as const,
				message: (error as T).response?.data?.mensagem ?? "",
				chave: null,
				numero: null,
			};
		}
	}

	// eslint-disable-next-line @typescript-eslint/ban-types
	private sanitize<T extends {}>(obj: T) {
		const isArray = Array.isArray(obj);
		// eslint-disable-next-line no-restricted-syntax
		for (const k of Object.keys(obj)) {
			if (obj[k] === null || obj[k] === undefined) {
				// eslint-disable-next-line no-param-reassign
				if (isArray) {
					// @ts-expect-error Erro qualquer
					obj.splice(k, 1);
				} else {
					// @ts-expect-error Erro qualquer
					delete obj[k];
				}
			} else if (typeof obj[k] === "object") {
				this.sanitize(obj[k]);
			}
		}

		return obj;
	}

	private mapToNationalNfsePayload(data: ISendNationalNfse) {
		return {
			data_emissao: data.issuedAt,
			data_competencia: data.competenceDate,
			codigo_municipio_emissora: data.seller.cityCode,
			cnpj_prestador: data.seller.document,
			// inscricao_municipal_prestador: data.seller.cityRegistration,
			codigo_opcao_simples_nacional: data.seller.simpleOptionCode,
			codigo_municipio_prestacao: data.service.cityCode,
			percentual_total_tributos_simples_nacional:
				data.seller.totalTaxPercentageSimplesNacional,
			regime_especial_tributacao: data.seller.specialTaxRegime,
			regime_tributario_simples_nacional:
				data.seller.regimeTributarySimplesNacional,
			cpf_tomador: data.buyer.cpfDocument,
			cnpj_tomador: data.buyer.cnpjDocument,
			razao_social_tomador: data.buyer.name,
			codigo_municipio_tomador:
				data.buyer.address.cityCode === 0
					? undefined
					: data.buyer.address.cityCode,
			cep_tomador: data.buyer.address.postalCode ?? undefined,
			logradouro_tomador: data.buyer.address.street ?? undefined,
			numero_tomador: data.buyer.address.number ?? undefined,
			complemento_tomador: data.buyer.address.complement ?? undefined,
			bairro_tomador: data.buyer.address.district ?? undefined,
			telefone_tomador: data.buyer.phone,
			email_tomador: data.buyer.email,
			descricao_servico: data.service.description,
			valor_servico: data.service.value,
			tributacao_iss: data.service.issTaxationType,
			tipo_retencao_iss: data.service.issRetentionType,
			codigo_tributacao_nacional_iss: data.service.nationalTaxationCode,
			codigo_nbs: Number(data.service.nationalServiceCode),
		};
	}

	public async getDownloadLinks(
		token: string,
		data: {
			cnpj: string;
			periodo: string;
		},
	) {
		const response = await this.ax.get(`/v2/backups/${data.cnpj}.json`, {
			auth: {
				username: token,
				password: "",
			},
		});

		const record = response.data.find((f) => f.mes === data.periodo);
		if (!record) {
			throw new ResourceNotFoundException(
				"Arquivo não encontrado",
				404,
				"E_BACKUP_NOT_FOUND",
			);
		}

		return record.xmls;
	}

	public async getNfe(ref: string, token: string, complete = true) {
		try {
			const { data } = await this.ax.get(`/v2/nfe/${ref}`, {
				params: {
					completa: complete ? 1 : 0,
				},
				auth: {
					username: token,
					password: "",
				},
			});

			const zodResponse = nfeResponseSchema.safeParse(data);
			if (!zodResponse.success) {
				return {
					success: false as const,
					error: "Resposta inválida",
				};
			}

			return {
				success: true as const,
				data: zodResponse.data,
			};
		} catch (error) {
			return {
				success: false as const,
				error: "Erro ao chamar",
			};
		}
	}

	public async getNfse(ref: string, token: string) {
		try {
			const { data } = await this.ax.get(`/v2/nfse/${ref}`, {
				params: {},
				auth: {
					username: token,
					password: "",
				},
			});

			const zodResponse = nfseResponseSchema.safeParse(data);
			if (!zodResponse.success) {
				return {
					success: false as const,
					error: "Resposta inválida",
					idk: zodResponse.error.format(),
				};
			}

			return {
				success: true as const,
				data: zodResponse.data,
			};
		} catch (error) {
			return {
				success: false as const,
				error: "Erro ao chamar",
				idk: "idk",
			};
		}
	}

	public async cancelNfe(ref: string, reason: string, token: string) {
		try {
			const { data } = await this.ax.delete(`/v2/nfe/${ref}`, {
				data: {
					justificativa: reason,
				},
				auth: {
					username: token,
					password: "",
				},
			});

			return data;
		} catch (error) {
			type T = TypedAxiosError<{ mensagem: string }, unknown>;
			// Logger.error((error as T).response?.data.mensagem ?? "");

			return null;
		}
	}

	// https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360015738793-Rejei%C3%A7%C3%A3o-241-Um-n%C3%BAmero-da-faixa-j%C3%A1-foi-utilizado
	public async disable(_ref: string, disableData: IDisableNfe, token: string) {
		try {
			const { data } = await this.ax.post(
				"/v2/nfe/inutilizacao",
				{
					cnpj: disableData.cnpj,
					serie: disableData.series,
					numero_inicial: disableData.sequence,
					numero_final: disableData.sequence,
					justificativa: disableData.reason,
				},
				{
					auth: {
						username: token,
						password: "",
					},
				},
			);

			const zodResponse = disableNfeResponseSchema.safeParse(data);
			if (!zodResponse.success) {
				// Logger.info(JSON.stringify(data, undefined, 2));
				// Logger.error("invalid schema");
				// Logger.error(JSON.stringify(zodResponse.error.issues, undefined, 2));
				return {
					success: true,
					data: null,
				};
			}

			return {
				success: true,
				data: zodResponse.data,
			};
		} catch (error) {
			// type T = TypedAxiosError<{ mensagem: string }, unknown>;
			// Logger.error((error as T).response?.data.mensagem ?? "");

			return {
				success: false as const,
			};
		}
	}

	public async sendNfse(
		ref: string,
		data: ISendNfse,
		token: string,
		meta: {
			hideCnae?: boolean;
			hideCityCode?: boolean;
		},
		tx: TransactionClientContract,
	) {
		const payload = {
			data_emissao: data.issuedAt,
			natureza_operacao: "1",
			regime_especial_tributacao: "6",
			optante_simples_nacional: data.simple,

			prestador: {
				cnpj: data.seller.document,
				codigo_municipio: data.seller.city_code,
				inscricao_municipal: data.seller.city_ie,
			},

			tomador: {
				cnpj: data.buyer.cnpj_document,
				cpf: data.buyer.cpf_document,
				razao_social: data.buyer.name,
				telefone: data.buyer.phone,
				email: data.buyer.email,
				endereco: {
					logradouro: data.buyer.address.street,
					numero: data.buyer.address.number,
					complemento: data.buyer.address.complement?.substring(0, 30),
					bairro: data.buyer.address.district,
					codigo_municipio: data.buyer.address.city_code,
					uf: data.buyer.address.uf,
					cep: data.buyer.address.postal_code,
				},
			},

			servico: {
				valor_servicos: data.service.total_value,
				valor_pis: data.service.pis_value,
				valor_cofins: data.service.cofins_value,
				iss_retido: "false",
				valor_iss: data.service.iss_value,
				base_calculo: data.service.base_value,
				aliquota: data.service.percentage_value,
				// desconto_incondicionado: data.service.discount_value,
				desconto_incondicionado: 0,
				item_lista_servico: data.service.service_code,
				codigo_cnae: meta.hideCnae ? undefined : data.service.cnae,
				discriminacao: data.service.description,
				codigo_tributario_municipio: meta.hideCityCode
					? undefined
					: data.service.city_code,
			},
		};

		if (payload.tomador.cpf) {
			// @ts-expect-error Aqui vai ocorrer um erro, mas estou ignorando
			delete payload.tomador.cnpj;
		}

		if (payload.tomador.cnpj) {
			// @ts-expect-error Aqui vai ocorrer um erro, mas estou ignorando
			delete payload.tomador.cpf;
		}

		if (payload.tomador.cnpj === "53165106001264") {
			payload["situacao"] = "tt";
		}

		await ServiceIssuedFiscalDocument.query()
			.where("id", ref)
			.update({
				payload: this.sanitize(payload),
			})
			.useTransaction(tx);

		try {
			const { data } = await this.ax.post(
				`/v2/nfse?ref=${ref}`,
				this.sanitize(payload),
				{
					auth: {
						username: token,
						password: "",
					},
				},
			);

			// Logger.info(JSON.stringify(data, undefined, 2));

			const parsedResponse = createNfseResponseSchema.safeParse(data);
			if (!parsedResponse.success) {
				// Logger.error("invalid schema");
				// Logger.error(JSON.stringify(parsedResponse.error.issues, undefined, 2));
				return {
					success: true,
					data: null,
				};
			}

			return {
				success: true as const,
				data: parsedResponse.data,
			};
		} catch (error) {
			// Logger.error(error.response);

			type T = TypedAxiosError<{ mensagem: string }, unknown>;
			return {
				success: false as const,
				message: (error as T).response?.data?.mensagem ?? "",
			};
		}
	}

	public async sendNationalNfse(
		ref: string,
		data: ISendNationalNfse,
		token: string,
		tx: TransactionClientContract,
	) {
		const payload = this.mapToNationalNfsePayload(data);

		await ServiceIssuedFiscalDocument.query()
			.where("id", ref)
			.update({
				payload: this.sanitize(payload),
			})
			.useTransaction(tx);

		try {
			const { data } = await this.ax.post(
				`/v2/nfsen?ref=${ref}`,
				this.sanitize(payload),
				{
					auth: {
						username: token,
						password: "",
					},
				},
			);

			Logger.info(JSON.stringify(data, undefined, 2));

			const parsedResponse = z
				.object({
					cnpj_prestador: z.string(),
					ref: z.string(),
					numero_rps: z.string(),
					serie_rps: z.string(),
					tipo_rps: z.string(),
					status: z.string(),
				})
				.safeParse(data);
			if (!parsedResponse.success) {
				// Logger.error("invalid schema");
				// Logger.error(JSON.stringify(parsedResponse.error.issues, undefined, 2));
				return {
					success: true,
					data: "NFSE criada mas resposta inválida",
				};
			}

			return {
				success: true as const,
				data: parsedResponse.data,
			};
		} catch (error) {
			Logger.error(error.response.headers, error.response.data);

			type T = TypedAxiosError<{ mensagem: string }, unknown>;
			return {
				success: false as const,
				message: (error as T).response?.data?.mensagem ?? "",
			};
		}
	}

	// hora do evento?
	// https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360015591514-Rejei%C3%A7%C3%A3o-578-A-data-do-evento-n%C3%A3o-pode-ser-maior-que-a-data-do-processamento
	public async cancelNfse(ref: string, reason: string, token: string) {
		try {
			const { data } = await this.ax.delete(`/v2/nfse/${ref}`, {
				data: {
					justificativa: reason,
				},
				auth: {
					username: token,
					password: "",
				},
			});

			// Logger.info(JSON.stringify(data, undefined, 2));

			return {
				success: true as const,
				status: data.status as "cancelado",
			};
			// const zodResponse = cancelNfeResponseSchema.safeParse(data);
			// if (!zodResponse.success) {
			//   console.log('invalid schema', zodResponse.error.issues);
			//   return null;
			// }

			// return zodResponse.data;
		} catch (error) {
			type T = TypedAxiosError<
				{
					status: "erro_cancelamento";
					erros: Array<{
						codigo: string;
						mensagem: string;
						correcao: string | null;
					}>;
				},
				unknown
			>;
			// Logger.error((error as T).response?.data.status ?? "");

			return {
				success: false as const,
				status: (error as T).response?.data.status,
				errors: (error as T).response?.data.erros,
			};
		}
	}

	public async listReceived(cnpj: string, token: string) {
		try {
			const { data } = await this.ax.get(`/v2/nfes_recebidas?cnpj=${cnpj}`, {
				auth: {
					username: token,
					password: "",
				},
			});

			return data;
		} catch (error) {
			// Logger.error(JSON.stringify(error, null, 2));
			throw new InternalErrorException(
				"Falha ao buscar na focus",
				500,
				"E_ERR",
			);
		}
	}

	public async searchReceived(ref: string, token: string, ext: "pdf" | "xml") {
		try {
			const { data } = await this.ax.get(`/v2/nfes_recebidas/${ref}.${ext}`, {
				auth: {
					username: token,
					password: "",
				},
			});

			return data;
		} catch (error) {
			// Logger.error(JSON.stringify(error, null, 2));
			throw new InternalErrorException(
				"Falha ao buscar na focus",
				500,
				"E_ERR",
			);
		}
	}
}
