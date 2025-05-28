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
	regime_tributario: string | null;
	codigo_municipio: string | null;
	email: string | null;
	codigo_pais: string | null;
	enviar_email_destinatario: boolean | null;
	enviar_email_homologacao: boolean | null;

	codigo_uf: string | null;
	//
	// habilita_nfce: boolean | null;
	// proximo_numero_nfce_producao: number | null;
	// csc_nfce_producao: string | null;
	// id_token_nfce_producao: number | null;
	// serie_nfce_producao: number | null;
	//
	// habilita_nfe: boolean | null;
	// proximo_numero_nfe_producao: number | null;
	// serie_nfe_producao: number | null;
	// nfe_sincrono: boolean | null;
	// orientacao_danfe: "portrait" | "landscape" | null;
	// recibo_danfe: boolean | null;
	// arquivo_certificado_base64: string | null;
	// senha_certificado: string | null;
	//
	// habilita_nfse: boolean | null;
	// inscricao_municipal: string | null;
	// serie_nfse_producao: number | null;
	// proximo_numero_nfse_producao: number | null;
	//
	// // id: 123;
	// cpf_cnpj_contabilidade: string | null;
	// cpf_responsavel: string | null;
	// cargo_responsavel: string | null;
	// nome_responsavel: string | null;
	// discrimina_impostos: boolean | null;
	//
	// habilita_nfsen_producao: boolean | null;
	// habilita_nfsen_homologacao: boolean | null;
	// habilita_cte: boolean | null;
	// habilita_mdfe: boolean | null;
	// habilita_manifestacao: boolean | null;
	// habilita_manifestacao_homologacao: boolean | null;
	// habilita_manifestacao_cte: boolean | null;
	// habilita_manifestacao_cte_homologacao: boolean | null;
	//
	// habilita_contingencia_offline_nfce: boolean | null;
	// habilita_contingencia_epec_nfce: boolean | null;
	// reaproveita_numero_nfce_contingencia: boolean | null;
	// mostrar_danfse_badge: boolean | null;
	// csc_nfce_homologacao: string | null;
	// id_token_nfce_homologacao: number | null;
	// proximo_numero_nfe_homologacao: number | null;
	// serie_nfe_homologacao: number | null;
	//
	// serie_nfse_homologacao: number | null;
	// proximo_numero_nfse_homologacao: number | null;
	// proximo_numero_nfsen_producao: number | null;
	// proximo_numero_nfsen_homologacao: number | null;
	//
	// serie_nfsen_producao: number | null;
	// serie_nfsen_homologacao: number | null;
	//
	// proximo_numero_nfce_homologacao: number | null;
	//
	// serie_nfce_homologacao: number | null;
	// proximo_numero_cte_producao: number | null;
	// proximo_numero_cte_homologacao: number | null;
	// serie_cte_producao: number | null;
	// serie_cte_homologacao: number | null;
	// proximo_numero_cte_os_producao: number | null;
	// proximo_numero_cte_os_homologacao: number | null;
	// serie_cte_os_producao: number | null;
	// serie_cte_os_homologacao: number | null;
	// proximo_numero_mdfe_producao: number | null;
	// proximo_numero_mdfe_homologacao: number | null;
	// serie_mdfe_producao: number | null;
	// serie_mdfe_homologacao: number | null;
	// certificado_valido_ate: string | null;
	// certificado_valido_de: string | null;
	// certificado_cnpj: string | null;
	// certificado_especifico: boolean | null;
	// data_ultima_emissao: string | null;
	// caminho_logo: string | null;
	// login_responsavel: string | null;
	// senha_responsavel_preenchida: boolean | null;
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

	public async createBusiness<
		T extends Record<string, string | number | number[]>,
	>(
		_authCtx: AuthContext,
		data: {
			businessUnitId: string;
			models: number[];
		} & T,
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
				cnpj: businessUnit.document ?? "23.513.384/0001-41",
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
				codigo_municipio: businessUnit.cityCode ?? null,
				email: businessUnit.email ?? null,
				codigo_pais: "1058",
				enviar_email_destinatario: true,
				enviar_email_homologacao: false,

				codigo_uf: "26",
			};
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
