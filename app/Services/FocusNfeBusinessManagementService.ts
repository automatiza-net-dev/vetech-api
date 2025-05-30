import { inject } from "@adonisjs/fold";
import Env from "@ioc:Adonis/Core/Env";
import Logger from "@ioc:Adonis/Core/Logger";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import BusinessUnit from "App/Models/BusinessUnit";
import IssuedFiscalDocument from "App/Models/IssuedFiscalDocument";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import { AuthContext } from "./SharedService";

type FocusEmpresa = {
	cnpj: string;
	nome: string;
	nome_fantasia: string | null;
	inscricao_estadual: string;
	cep: string;
	logradouro: string;
	municipio: string;
	numero: string;
	complemento: string;
	bairro: string;
	pais: string;
	telefone: string;
	uf: string;
	regime_tributario: string;
	codigo_municipio: string;
	email: string;
	codigo_pais: string;
	enviar_email_destinatario: boolean;
	enviar_email_homologacao: boolean;

	codigo_uf?: string | null;

	habilita_nfce?: boolean;
	proximo_numero_nfce_producao?: number;
	csc_nfce_producao?: string;
	id_token_nfce_producao?: number;
	serie_nfce_producao?: number;

	habilita_nfe?: boolean;
	proximo_numero_nfe_producao?: number;
	serie_nfe_producao?: number;
	nfe_sincrono?: boolean;
	orientacao_danfe?: "portrait" | "landscape";
	recibo_danfe?: boolean;
	arquivo_certificado_base64?: string;
	senha_certificado?: string;

	habilita_nfse?: boolean;
	inscricao_municipal?: string;
	serie_nfse_producao?: number;
	proximo_numero_nfse_producao?: number;

	// id?: 123;
	cpf_cnpj_contabilidade?: string;
	cpf_responsavel?: string;
	cargo_responsavel?: string;
	nome_responsavel?: string;
	discrimina_impostos?: boolean;

	habilita_nfsen_producao?: boolean;
	habilita_nfsen_homologacao?: boolean;
	habilita_cte?: boolean;
	habilita_mdfe?: boolean;
	habilita_manifestacao?: boolean;
	habilita_manifestacao_homologacao?: boolean;
	habilita_manifestacao_cte?: boolean;
	habilita_manifestacao_cte_homologacao?: boolean;

	habilita_contingencia_offline_nfce?: boolean;
	habilita_contingencia_epec_nfce?: boolean;
	reaproveita_numero_nfce_contingencia?: boolean;
	mostrar_danfse_badge?: boolean;
	csc_nfce_homologacao?: string;
	id_token_nfce_homologacao?: number;
	proximo_numero_nfe_homologacao?: number;
	serie_nfe_homologacao?: number;

	serie_nfse_homologacao?: number;
	proximo_numero_nfse_homologacao?: number;
	proximo_numero_nfsen_producao?: number;
	proximo_numero_nfsen_homologacao?: number;

	serie_nfsen_producao?: number;
	serie_nfsen_homologacao?: number;

	proximo_numero_nfce_homologacao?: number;

	serie_nfce_homologacao?: number;
	proximo_numero_cte_producao?: number;
	proximo_numero_cte_homologacao?: number;
	serie_cte_producao?: number;
	serie_cte_homologacao?: number;
	proximo_numero_cte_os_producao?: number;
	proximo_numero_cte_os_homologacao?: number;
	serie_cte_os_producao?: number;
	serie_cte_os_homologacao?: number;
	proximo_numero_mdfe_producao?: number;
	proximo_numero_mdfe_homologacao?: number;
	serie_mdfe_producao?: number;
	serie_mdfe_homologacao?: number;
	certificado_valido_ate?: string;
	certificado_valido_de?: string;
	certificado_cnpj?: string;
	certificado_especifico?: boolean;
	data_ultima_emissao?: string;
	caminho_logo?: string;
	login_responsavel?: string;
	senha_responsavel?: string;
	senha_responsavel_preenchida?: boolean;
};

@inject()
export default class FocusNfeBusinessManagementService {
	private ax = axios.create({
		baseURL: "https://api.focusnfe.com.br",
		headers: {},
		auth: {
			username: Env.get("FOCUS_NFE_MANAGEMENT_TOKEN"),
			password: "",
		},
	});

	public async createBusiness(
		_authCtx: AuthContext,
		data: {
			businessUnitId: string;
			models: [0, 55, 65][number][];
		},
		dynamicData: Record<string, string | number>,
	) {
		await Database.transaction(async (trx) => {
			const businessUnit = await BusinessUnit.query()
				.useTransaction(trx)
				.preload("unitConfig")
				.where("id", data.businessUnitId)
				.firstOrFail();

			if (businessUnit.focusRef) {
				throw new BadRequestException(
					"Esta unidade já está cadastrada no FocusNFe",
					400,
					"E_ERR",
				);
			}

			const url =
				businessUnit.unitConfig.fiscalDocumentEnvironment === "H"
					? "/v2/empresas?dry_run=1"
					: "/v2/empresas";

			const payload: FocusEmpresa = {
				cnpj: businessUnit.document ?? "",
				nome: businessUnit.companyName ?? "",
				nome_fantasia: businessUnit.fantasyName ?? null,
				inscricao_estadual: businessUnit.stateRegistration ?? "",
				cep: businessUnit.postalCode ?? "",
				logradouro: businessUnit.address ?? "",
				numero: businessUnit.number ?? "",
				complemento: businessUnit.complement ?? "",
				bairro: businessUnit.district ?? "",
				municipio: businessUnit.city ?? "",
				uf: businessUnit.state ?? "",
				pais: "BR",
				telefone: businessUnit.phone ?? "",

				regime_tributario: businessUnit.simple ? "1" : "3",
				codigo_municipio: businessUnit.cityCode ?? "",
				email: businessUnit.email ?? "",
				codigo_pais: "1058",
				enviar_email_destinatario: true,
				enviar_email_homologacao: false,

				codigo_uf: "26",
			};

			if (data.models.includes(0)) {
				payload.inscricao_municipal = businessUnit.cityRegistration;
				payload.serie_nfse_producao = +dynamicData.serieNfseProducao;
				payload.proximo_numero_nfse_producao =
					+dynamicData.proximoNumeroNfseProducao;
				payload.login_responsavel = dynamicData.loginResponsavel.toString();
				payload.senha_responsavel = dynamicData.senhaResponsavel.toString();
				payload.senha_responsavel_preenchida = true;
				payload.habilita_nfse = true;
			}

			if (data.models.includes(65)) {
				payload.proximo_numero_nfce_producao =
					+dynamicData.proximoNumeroNfceProducao;
				payload.csc_nfce_producao = dynamicData.cscNfceProducao.toString();
				payload.id_token_nfce_producao = +dynamicData.idTokenNfceProducao;
				payload.serie_nfce_producao = +dynamicData.serieNfceProducao;
				payload.habilita_nfce = true;
				payload.habilita_contingencia_offline_nfce = true;
				payload.reaproveita_numero_nfce_contingencia = true;

				payload.arquivo_certificado_base64 =
					dynamicData.arquivoCertificadoBase64.toString();
				payload.senha_certificado = dynamicData.senhaCertificado.toString();
				payload.certificado_especifico = true;
				payload.orientacao_danfe = "portrait";
				payload.discrimina_impostos = true;
				payload.recibo_danfe = true;
			}

			if (data.models.includes(55)) {
				payload.proximo_numero_nfe_producao =
					+dynamicData.proximo_numero_nfe_producao;
				payload.serie_nfe_producao = +dynamicData.serie_nfe_producao;
				payload.habilita_nfe = true;
				payload.nfe_sincrono = false;

				payload.arquivo_certificado_base64 =
					dynamicData.arquivoCertificadoBase64.toString();
				payload.senha_certificado = dynamicData.senhaCertificado.toString();
				payload.certificado_especifico = true;
				payload.orientacao_danfe = "portrait";
				payload.discrimina_impostos = true;
				payload.recibo_danfe = true;
			}

      return payload

			try {
				// {data} => {id: number}
				const { data } = await this.ax.post(url, payload);

				await businessUnit
					.merge({ focusRef: data.id.toString() })
					.useTransaction(trx)
					.save();

				return {};
			} catch (error) {
				if (error instanceof AxiosError) {
					console.log(error.response?.data);

					if (!error.response?.data.mensagem) {
						throw new BadRequestException(
							"Erro na comunicação com a FocusNFe",
							400,
							"E_ERR",
						);
					}

					if (!Array.isArray(error.response.data.erros)) {
						throw new BadRequestException(
							error?.response?.data.mensagem,
							400,
							"E_ERR",
						);
					}

					throw new BadRequestException(
						error.response.data.erros
							.reduce(
								(
									acc: string[],
									curr: { codigo: string; mensagem: string; campo: null },
								) => {
									if (acc.includes(curr.mensagem)) {
										return acc;
									}

									acc.push(curr.mensagem);

									return acc;
								},
								[error.response.data.mensagem],
							)
							.join("; "),
						400,
						"E_ERR",
					);
				}

				throw error;
			}
		});
	}
}
