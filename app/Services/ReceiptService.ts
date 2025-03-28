import { inject } from "@adonisjs/fold";
import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import Drive from "@ioc:Adonis/Core/Drive";
import Logger from "@ioc:Adonis/Core/Logger";
import Database, {
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import BusinessUnit from "App/Models/BusinessUnit";
import BusinessUnitCheckingAccountPaymentMethod from "App/Models/BusinessUnitCheckingAccountPaymentMethod";
import { BusinessUnitFiscalDocumentMovementType } from "App/Models/BusinessUnitFiscalDocument";
import BusinessUnitProduct, {
	BusinessUnitProductMetaType,
} from "App/Models/BusinessUnitProduct";
import DailyMovement, { DailyMovementStatus } from "App/Models/DailyMovement";
import Finance, {
	FinanceAccept,
	FinanceOriginFlag,
	FinanceStatus,
	FinanceType,
} from "App/Models/Finance";
import IssuedFiscalDocument, {
	IssuedFiscalDocumentContingency,
} from "App/Models/IssuedFiscalDocument";
import Patient, { PatientType } from "App/Models/Patient";
import PatientTutor from "App/Models/PatientTutor";
import PaymentMethod, {
	PaymentMethodTef,
	PaymentMethodUsage,
} from "App/Models/PaymentMethod";
import Product, { ProductPurpose, ProductType } from "App/Models/Product";
import ProductVariation from "App/Models/ProductVariation";
import Receipt, { TReceiptStatus } from "App/Models/Receipt";
import ReceiptItem, {
	ReceiptItemStatus,
	TReceiptItemStatus,
} from "App/Models/ReceiptItem";
import ReceiptPayment, {
	TReceiptPaymentStatus,
} from "App/Models/ReceiptPayment";
import ReceiptXml from "App/Models/ReceiptXml";
import SupplierProduct from "App/Models/SupplierProduct";
import TaxationGroup from "App/Models/TaxationGroup";
import TaxationGroupRule, {
	MovementCategory,
	MovementType,
} from "App/Models/TaxationGroupRule";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { GenerateTag } from "App/Utils/GenerateTag";
import { format } from "date-fns";
import { Decimal } from "decimal.js";
import { DateTime } from "luxon";
import xmlParser from "xml2json";
import { z } from "zod";

const detSchema = z.object({
	prod: z.object({
		cProd: z.string(),
		cEAN: z.string(),
		xProd: z.string(),
		NCM: z.string(),
		CFOP: z.string(),
		uCom: z.string(),
		qCom: z.coerce.number(),
		vUnCom: z.coerce.number(),
		vProd: z.coerce.number(),
		cEANTrib: z.string(),
		uTrib: z.string(),
		qTrib: z.string(),
		vUnTrib: z.string(),
		indTot: z.string(),
		vDesc: z.optional(z.coerce.number()),
	}),
	imposto: z.optional(
		z.object({
			ICMS: z.object({
				ICMS00: z.optional(
					z.object({
						orig: z.string(),
						CST: z.string(),
						modBC: z.string(),
						vBC: z.coerce.number(),
						pICMS: z.coerce.number(),
						vICMS: z.coerce.number(),
					}),
				),
				ICMS10: z.optional(
					z.object({
						orig: z.string(),
						CST: z.string(),
						vBC: z.coerce.number(),
						pICMS: z.coerce.number(),
						vICMS: z.coerce.number(),
						pMVAST: z.optional(z.coerce.number()),
						pRedBCST: z.optional(z.coerce.number()),
						vBCST: z.coerce.number(),
						pICMSST: z.coerce.number(),
						vICMSST: z.coerce.number(),
					}),
				),
				ICMS20: z.optional(
					z.object({
						orig: z.string(),
						CST: z.string(),
						pRedBC: z.coerce.number(),
						vBC: z.coerce.number(),
						pICMS: z.coerce.number(),
						vICMS: z.coerce.number(),
						vICMSDeson: z.optional(z.coerce.number()),
					}),
				),
				ICMS30: z.optional(
					z.object({
						orig: z.string(),
						CST: z.string(),
						pMVAST: z.optional(z.coerce.number()),
						pRedBCST: z.optional(z.coerce.number()),
						vBCST: z.coerce.number(),
						pICMSST: z.coerce.number(),
						vICMSST: z.coerce.number(),
						vICMSDeson: z.optional(z.coerce.number()),
					}),
				),
				ICMS40: z.optional(
					z.object({
						orig: z.string(),
						CST: z.string(),
						vICMSDeson: z.optional(z.coerce.number()),
					}),
				),
				ICMS51: z.optional(
					z.object({
						orig: z.string(),
						CST: z.string(),
						pRedBC: z.optional(z.coerce.number()),
						vBC: z.optional(z.coerce.number()),
						pICMS: z.optional(z.coerce.number()),
						vICMSOp: z.optional(z.coerce.number()),
						pDif: z.optional(z.coerce.number()),
						vICMSDif: z.optional(z.coerce.number()),
						vICMS: z.optional(z.coerce.number()),
					}),
				),
				ICMS60: z.optional(
					z.object({
						orig: z.string(),
						CST: z.string(),
						vBCSTRet: z.optional(z.coerce.number()),
						vICMSSTRet: z.optional(z.coerce.number()),
					}),
				),
				ICMS70: z.optional(
					z.object({
						orig: z.string(),
						CST: z.string(),
						pRedBC: z.optional(z.coerce.number()),
						vBC: z.optional(z.coerce.number()),
						pICMS: z.optional(z.coerce.number()),
						vICMS: z.optional(z.coerce.number()),
						pMVAST: z.optional(z.coerce.number()),
						pRedBCST: z.optional(z.coerce.number()),
						vBCST: z.optional(z.coerce.number()),
						pICMSST: z.optional(z.coerce.number()),
						vICMSST: z.optional(z.coerce.number()),
						vICMSDeson: z.optional(z.coerce.number()),
					}),
				),
				ICMS90: z.optional(
					z.object({
						orig: z.string(),
						CST: z.string(),
						pRedBC: z.optional(z.coerce.number()),
						vBC: z.optional(z.coerce.number()),
						pICMS: z.optional(z.coerce.number()),
						vICMS: z.optional(z.coerce.number()),
						pMVAST: z.optional(z.coerce.number()),
						pRedBCST: z.optional(z.coerce.number()),
						vBCST: z.optional(z.coerce.number()),
						pICMSST: z.optional(z.coerce.number()),
						vICMSST: z.optional(z.coerce.number()),
						vICMSDeson: z.optional(z.coerce.number()),
					}),
				),
				ICMSSN101: z.optional(
					z.object({
						orig: z.string(),
						CSOSN: z.string(),
						pCredSN: z.coerce.number(),
						vCredICMSSN: z.coerce.number(),
					}),
				),
				ICMSSN102: z.optional(
					z.object({
						orig: z.string(),
						CSOSN: z.string(),
					}),
				),
				ICMSSN201: z.optional(
					z.object({
						orig: z.string(),
						CSOSN: z.string(),
						pMVAST: z.optional(z.coerce.number()),
						pRedBCST: z.optional(z.coerce.number()),
						vBCST: z.coerce.number(),
						pICMSST: z.coerce.number(),
						vICMSST: z.coerce.number(),
						pCredSN: z.coerce.number(),
						vCredICMSSN: z.coerce.number(),
					}),
				),
				ICMSSN202: z.optional(
					z.object({
						orig: z.string(),
						CSOSN: z.string(),
						pMVAST: z.optional(z.coerce.number()),
						pRedBCST: z.optional(z.coerce.number()),
						vBCST: z.coerce.number(),
						pICMSST: z.coerce.number(),
						vICMSST: z.coerce.number(),
					}),
				),
				ICMSSN500: z.optional(
					z.object({
						orig: z.string(),
						CSOSN: z.string(),
						vBCSTRet: z.optional(z.coerce.number()),
						pICMSSTRet: z.optional(z.coerce.number()),
					}),
				),
				ICMSSN900: z.optional(
					z.object({
						orig: z.string(),
						CSOSN: z.string(),
						vBC: z.optional(z.coerce.number()),
						pRedBC: z.optional(z.coerce.number()),
						pICMS: z.optional(z.coerce.number()),
						vICMS: z.optional(z.coerce.number()),
						pMVAST: z.optional(z.coerce.number()),
						pRedBCST: z.optional(z.coerce.number()),
						vBCST: z.optional(z.coerce.number()),
						pICMSST: z.optional(z.coerce.number()),
						vICMSST: z.optional(z.coerce.number()),
						pCredSN: z.optional(z.coerce.number()),
						vCredICMSSN: z.optional(z.coerce.number()),
					}),
				),
			}),
			PIS: z.optional(
				z.object({
					PISAliq: z.optional(
						z.object({
							CST: z.string(),
							vBC: z.coerce.number(),
							pPIS: z.coerce.number(),
							vPIS: z.coerce.number(),
						}),
					),
					PISQtde: z.optional(
						z.object({
							CST: z.string(),
							vBC: z.coerce.number(),
							pPIS: z.coerce.number(),
							vPIS: z.coerce.number(),
						}),
					),
					PISNT: z.optional(
						z.object({
							CST: z.string(),
							vBC: z.optional(
								z.string().refine((val) => Number.parseFloat(val)),
							),
							pPIS: z.optional(
								z.string().refine((val) => Number.parseFloat(val)),
							),
							vPIS: z.optional(
								z.string().refine((val) => Number.parseFloat(val)),
							),
						}),
					),
					PISOutr: z.optional(
						z.object({
							CST: z.string(),
							vBC: z.coerce.number(),
							pPIS: z.coerce.number(),
							vPIS: z.coerce.number(),
						}),
					),
				}),
			),
			COFINS: z.optional(
				z.object({
					COFINSAliq: z.optional(
						z.object({
							CST: z.string(),
							vBC: z.coerce.number(),
							pCOFINS: z.coerce.number(),
							vCOFINS: z.coerce.number(),
						}),
					),
					COFINSQtde: z.optional(
						z.object({
							CST: z.string(),
							vBC: z.coerce.number(),
							pCOFINS: z.coerce.number(),
							vCOFINS: z.coerce.number(),
						}),
					),
					COFINSNT: z.optional(
						z.object({
							CST: z.string(),
							vBC: z.optional(
								z.string().refine((val) => Number.parseFloat(val)),
							),
							pCOFINS: z.optional(
								z.string().refine((val) => Number.parseFloat(val)),
							),
							vCOFINS: z.optional(
								z.string().refine((val) => Number.parseFloat(val)),
							),
						}),
					),
					COFINSOutr: z.optional(
						z.object({
							CST: z.string(),
							vBC: z.coerce.number(),
							pCOFINS: z.coerce.number(),
							vCOFINS: z.coerce.number(),
						}),
					),
				}),
			),
		}),
	),
	_nItem: z.optional(z.string()),
});

// const dupSchema = z.object({
// 	vDup: z.coerce.number(),
// 	dVenc: z.string(),
// 	nDup: z.string(),
// });

const schema = z.object({
	nfeProc: z.object({
		NFe: z.object({
			infNFe: z.object({
				ide: z.object({
					cUF: z.string(),
					cNF: z.string(),
					natOp: z.string(),
					mod: z.string(),
					serie: z.string(),
					nNF: z.string(),
					dhEmi: z.string(),
					dhSaiEnt: z.optional(z.string()),
					tpNF: z.string(),
					idDest: z.string(),
					cMunFG: z.string(),
					tpImp: z.string(),
					tpEmis: z.string(),
					cDV: z.string(),
					tpAmb: z.string(),
					finNFe: z.string(),
					indFinal: z.string(),
					indPres: z.string(),
					procEmi: z.string(),
					verProc: z.string(),
				}),
				emit: z.object({
					CNPJ: z.string(),
					xNome: z.string(),
					xFant: z.string(),
					enderEmit: z.object({
						xLgr: z.string(),
						nro: z.string(),
						xCpl: z.optional(z.string()),
						xBairro: z.string(),
						cMun: z.string(),
						xMun: z.string(),
						UF: z.string(),
						CEP: z.string(),
						cPais: z.string(),
						xPais: z.string(),
						fone: z.string(),
					}),
					IE: z.string(),
					CRT: z.string(),
				}),
				dest: z.optional(
					z.object({
						CNPJ: z.optional(z.string()),
						CPF: z.optional(z.string()),
						xNome: z.string(),
						enderDest: z.object({
							xLgr: z.string(),
							nro: z.string(),
							xCpl: z.optional(z.string()),
							xBairro: z.string(),
							cMun: z.string(),
							xMun: z.string(),
							UF: z.string(),
							CEP: z.string(),
							cPais: z.string(),
							xPais: z.string(),
							fone: z.optional(z.string()),
						}),
						indIEDest: z.string(),
						IE: z.optional(z.string()),
						email: z.optional(z.string()),
					}),
				),
				det: z.union([z.array(detSchema), detSchema]),
				total: z.object({
					ICMSTot: z.object({
						vBC: z.coerce.number(),
						vICMS: z.coerce.number(),
						vICMSDeson: z.coerce.number(),
						vFCP: z.coerce.number(),
						vBCST: z.coerce.number(),
						vST: z.coerce.number(),
						vFCPST: z.coerce.number(),
						vFCPSTRet: z.coerce.number(),
						vProd: z.coerce.number(),
						vFrete: z.coerce.number(),
						vSeg: z.coerce.number(),
						vDesc: z.coerce.number(),
						vII: z.coerce.number(),
						vIPI: z.coerce.number(),
						vIPIDevol: z.coerce.number(),
						vPIS: z.coerce.number(),
						vCOFINS: z.coerce.number(),
						vOutro: z.coerce.number(),
						vNF: z.coerce.number(),
						vICMSUFDest: z.optional(z.coerce.number()),
					}),
				}),
				transp: z.object({
					modFrete: z.string(),
					vol: z.optional(z.object({ qVol: z.string().optional() })),
				}),
				// cobr: z.optional(
				// 	z.object({
				// 		fat: z.optional(
				// 			z.object({
				// 				nFat: z.string(),
				// 				vOrig: z.string(),
				// 				vDesc: z.string(),
				// 				vLiq: z.coerce.number(),
				// 			}),
				// 		),
				// 		dup: z.union([z.array(dupSchema), z.optional(dupSchema)]),
				// 	}),
				// ),
				// pag: z.object({
				// 	detPag: z.object({
				// 		tPag: z.string(),
				// 		xPag: z.optional(z.string()),
				// 		vPag: z.string(),
				// 	}),
				// }),
				infAdic: z.object({
					infCpl: z.optional(z.string()),
					infAdFisco: z.optional(z.string()),
				}),
				// infRespTec: z.object({
				// 	CNPJ: z.string(),
				// 	xContato: z.string(),
				// 	email: z.string(),
				// 	fone: z.string(),
				// }),
				_versao: z.optional(z.string()),
				_Id: z.optional(z.string()),
			}),
			Signature: z.object({
				SignedInfo: z.object({
					CanonicalizationMethod: z.object({
						_Algorithm: z.optional(z.string()),
					}),
					SignatureMethod: z.object({ _Algorithm: z.optional(z.string()) }),
					Reference: z.object({
						Transforms: z.object({
							Transform: z.array(
								z.object({ _Algorithm: z.optional(z.string()) }),
							),
						}),
						DigestMethod: z.object({ _Algorithm: z.optional(z.string()) }),
						DigestValue: z.optional(z.string()),
						_URI: z.optional(z.string()),
					}),
				}),
				SignatureValue: z.string(),
				KeyInfo: z.object({
					X509Data: z.object({ X509Certificate: z.string() }),
				}),
				_xmlns: z.optional(z.string()),
			}),
			_xmlns: z.optional(z.string()),
		}),
		protNFe: z.object({
			infProt: z.object({
				tpAmb: z.string(),
				verAplic: z.string(),
				chNFe: z.string(),
				dhRecbto: z.string(),
				nProt: z.string(),
				digVal: z.string(),
				cStat: z.string(),
				xMotivo: z.string(),
			}),
			_versao: z.optional(z.string()),
		}),
		_xmlns: z.optional(z.string()),
		_versao: z.optional(z.string()),
	}),
});

@inject()
export default class ReceiptService {
	constructor(private sharedService: SharedService) {}

	async index(
		authCtx: AuthContext,
		data: {
			from?: string;
			to?: string;
			tag?: string;
			supplier?: string;
			seller?: string;
			status?: string;
			receipt_id?: string;
		},
	) {
		const qb = Receipt.query()
			.preload("user", (query) => {
				query.select("id", "name");
			})
			.preload("seller", (query) => {
				query.select("id", "name");
			})
			.preload("supplier", (query) => {
				query.select("id", "name");
			})
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.orderByRaw("receipt_date desc");

		if (data.receipt_id) {
			qb.where("id", data.receipt_id);
		}

		if (data.from) {
			qb.whereRaw("receipt_date::date >= ?", [data.from]);
		}

		if (data.to) {
			qb.whereRaw("receipt_date::date <= ?", [data.to]);
		}

		if (data.tag) {
			qb.where("tag", data.tag);
		}

		if (data.supplier) {
			qb.where("supplier_id", data.supplier);
		}

		if (data.seller) {
			qb.where("seller_id", data.seller);
		}

		return (await qb).map((elem) => ({
			id: elem.id,
			tag: elem.tag,
			origin: elem.origin,
			issueDate: elem.issueDate,
			receiptDate: elem.receiptDate,
			totalValue: elem.totalValue,
			paidValue: elem.paidValue,
			status: elem.status,
			user: elem.user,
			seller: elem.seller,
			supplier: elem.supplier,
		}));
	}

	async productsIndex(authCtx: AuthContext) {
		const qb = Receipt.query()
			.preload("supplier", (query) => {
				query.select("id", "name");
			})
			.preload("items", (query) => {
				query.whereNotNull("product_variation_id");
				query.whereHas("productVariation", (query) => {
					query.whereHas("product", (query) => {
						query.whereNull("purpose");
					});
				});

				query.select("id", "quantity", "product_variation_id");

				query.preload("productVariation", (query) => {
					query.preload("product", (query) => {
						query.select(
							"id",
							"description",
							"reference_code",
							"purpose",
							"fractioned",
							"fractionValue",
							"subgroup_id",
							"unit_id",
							"fraction_unit_id",
							"taxation_group_id",
						);

						query.preload("subgroup", (query) => {
							query.select("id");
						});
						query.preload("unit", (query) => {
							query.select("id");
						});
						query.preload("fractionUnit", (query) => {
							query.select("id");
						});
						query.preload("taxationGroup", (query) => {
							query.select("id");
						});
					});
					query.preload("businessUnitProducts", (query) => {
						query.where("businness_unit_id", authCtx.unit.id);
					});
				});
			})
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.whereIn("status", ["Aberta", "PendenteXml"] as TReceiptStatus[])
			.whereHas("items", (query) => {
				query.whereNotNull("product_variation_id");
				query.whereHas("productVariation", (query) => {
					query.whereHas("product", (query) => {
						query.whereNull("purpose");
					});
				});
			});

		return (await qb).map((elem) => ({
			id: elem.id,
			tag: elem.tag,
			issueDate: elem.issueDate,
			totalValue: elem.totalValue,
			supplier: elem.supplier,
			items: elem.items,
		}));
	}

	async show(authCtx: AuthContext, data: { ids?: string[]; status?: string }) {
		if (!data.ids || !Array.isArray(data.ids) || data.ids.length === 0) {
			throw new BadRequestException("Nenhum ID informado", 400, "E_NO_IDS");
		}

		if (
			data.status &&
			!ReceiptItemStatus.includes(data.status as TReceiptItemStatus)
		) {
			throw new BadRequestException(
				`Status inválido. Valores possíveis: ${ReceiptItemStatus.join(", ")}`,
				400,
				"E_INVALID_STATUS",
			);
		}

		const rows = await Receipt.query()
			.where("business_unit_id", authCtx.unit.id)
			.whereIn("id", data.ids)
			.preload("user", (query) => {
				query.select("id", "name");
			})
			.preload("seller", (query) => {
				query.select("id", "name");
			})
			.preload("supplier", (query) => {
				query.select("id", "name");
				query.preload("tutor", (query) => {
					query.select("id", "account_plan_id");
				});
			})
			.preload("businessUnit", (query) => {
				query.select("id", "identification");
			})
			.preload("payments", (query) => {
				query.preload("acquirer", (query) => {
					query.select("id", "description");
				});
				query.preload("flag", (query) => {
					query.select("id", "description", "code", "type");
				});
				query.preload("paymentMethod");
			})
			.preload("items", (query) => {
				if (data.status) {
					query.where("status", data.status);
				} else {
					query.where("status", "Ativo" as TReceiptItemStatus);
				}

				query.orderBy("description_xml", "asc");

				query.preload("productVariation", (query) => {
					query.preload("variationOptions");
					query.preload("product");
				});
			});

		return rows;
	}

	async updateXmlItems(
		authCtx: AuthContext,
		data: {
			items: {
				productId: string;
				variationGroupId?: string;
				subgroupId: string;
				unitId: string;
				taxationGroupId: string;
				brandId?: string;
				productVariationId: string;

				referenceCode?: string;
				purpose: ProductPurpose;
				barcode?: string;
				minimumStock: number;
				maximumStock: number;
				maximumDiscountPercentage: number;
				price: number;
				costPrice: number;
				profitMargin: number;
				commission: number;
				commissionMeta: number;
				metaType: BusinessUnitProductMetaType;
				meta: number;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			const units = await BusinessUnit.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id);

			const tasks = data.items.map(async (item) => {
				const product = await Product.findOrFail(item.productId, {
					client: trx,
				});

				await product
					.merge({
						unit_id: item.unitId,
						subgroup_id: item.subgroupId,
						taxation_group_id: item.taxationGroupId,
						brand_id: item.brandId,

						referenceCode: item.referenceCode,
						purpose: item.purpose,
					})
					.useTransaction(trx)
					.save();

				const variation = await ProductVariation.query()
					.useTransaction(trx)
					.where("product_id", item.productId)
					.where("id", item.productVariationId)
					.firstOrFail();
				await variation
					.merge({
						barcode: item.barcode,
					})
					.useTransaction(trx)
					.save();

				await BusinessUnitProduct.query()
					.useTransaction(trx)
					.whereIn(
						"businness_unit_id",
						units.map((u) => u.id),
					)
					.where("product_variation_id", item.productVariationId)
					.update({
						cost_price: item.costPrice,
						price: item.price,
						maximum_stock: item.maximumStock,
						minimum_stock: item.minimumStock,
						maximum_discount_percentage: item.maximumDiscountPercentage,
						profit_margin: item.profitMargin,
						commission: item.commission,
						meta_type: item.metaType,
						meta: item.meta,
						commission_meta: item.commissionMeta,
					});
			});
			await Promise.all(tasks);
		});
	}

	async importFromXml(
		authCtx: AuthContext,
		data: {
			file: MultipartFileContract;
		},
	) {
		const key = `${authCtx.unit.id}/${data.file.clientName}`;
		const s3Key = `xml-imports/${authCtx.unit.id}/${Date.now()}-${data.file.clientName}`;

		await data.file.moveToDisk(
			"xml-imports",
			{
				name: s3Key,
			},
			"s3",
		);

		const receiptXml = await ReceiptXml.create(
			{
				economic_group_id: authCtx.group.id,
				business_unit_id: authCtx.unit.id,
				user_id: authCtx.user.id,
				// receipt_id: newReceipt.id,
				xmlFile: s3Key,
			},
			{
				// client: trx,
			},
		);

		await data.file.moveToDisk(
			"receipts",
			{
				name: key,
			},
			"s3",
		);

		const fileContents = await Drive.get(`receipts/${key}`);
		let result = {};
		try {
			result = xmlParser.toJson(fileContents.toString(), { object: true });
		} catch (e) {
			Logger.error(e);
			throw new BadRequestException(
				"Não foi possível ler o arquivo",
				400,
				"E_INTERNAL",
			);
		}

		const parsed = schema.safeParse(result);
		if (!parsed.success) {
			console.log(parsed.error.message);
			throw new BadRequestException("Arquivo inválido", 400, "E_INVALID_FILE");
		}

		if (parsed.data.nfeProc.protNFe.infProt.tpAmb !== "1") {
			throw new BadRequestException(
				"Esta nota fiscal não foi emitida em ambiente de Produção, importação cancelada",
				400,
				"E_NOT_PROD",
			);
		}

		return Database.transaction(async (trx) => {
			const issuedAlready = await IssuedFiscalDocument.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("access_key", parsed.data.nfeProc.protNFe.infProt.chNFe)
				.where("active", true)
				.preload("bill", (query) => {
					query.preload("businessUnit");
				})
				.first();
			if (issuedAlready) {
				throw new BadRequestException(
					`Esta nota já foi importada na unidade '${
						issuedAlready.bill?.businessUnit?.identification ??
						"Não identificado"
					}' no dia ${format(
						issuedAlready.authorizationDate.toJSDate(),
						"dd/MM/yyyy",
					)} com a tag '${issuedAlready.bill?.tag ?? "-"}'`,
					400,
					"E_IMPORTED",
				);
			}

			if (parsed.data.nfeProc.NFe.infNFe.dest?.CNPJ) {
				const unit = await BusinessUnit.query()
					.useTransaction(trx)
					.where("document", parsed.data.nfeProc.NFe.infNFe.dest.CNPJ)
					.first();

				if (!unit) {
					throw new BadRequestException(
						"CNPJ não percente a nenhuma unidade",
						400,
						"E_INVALID_DOC",
					);
				}

				if (unit.economicGroupId !== authCtx.group.id) {
					throw new BadRequestException(
						`O CNPJ do destinatário desta nota fiscal é a Unidade "${unit.identification}" e você está logado na Unidade "${authCtx.unit.identification}"`,
						400,
						"E_INVALID_DOC",
					);
				}
			}

			const dailyMovementId = await this.getDailyMovementForImport(
				trx,
				authCtx,
			);

			const supplierId = await this.getSupplierForImport(
				trx,
				parsed.data,
				authCtx,
			);

			const products = await Product.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.whereHas("variations", (query) => {
					query.whereNot("barcode", "SEM GTIN");
				})
				.preload("variations");

			const supplierProducts = await SupplierProduct.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("supplier_id", supplierId)
				.whereHas("productVariation", (query) => {
					query.whereNot("barcode", "SEM GTIN");
				})
				.preload("productVariation", (query) => {
					query.preload("product");
				});

			const receiptsCounter = await Receipt.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id);

			const newReceipt = await Receipt.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					supplier_id: supplierId,
					user_id: authCtx.user.id,
					seller_id: authCtx.user.id,
					daily_movement_id: dailyMovementId,

					origin: "Xml",
					issueDate: DateTime.now(),
					receiptDate: DateTime.now(),
					tag: GenerateTag(receiptsCounter.length + 1),
					productValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vProd,
					discountValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vDesc,
					deliveryValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vFrete,
					totalValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vNF,
					icmsBase: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vBC,
					icmsValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vICMS,
					icmsStBase: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vBCST,
					icmsStValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vST,
					pisBase: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vProd,
					pisValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vPIS,
					cofinsBase: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vProd,
					cofinsValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vCOFINS,
					ipiBase: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vProd,
					ipiValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vIPI,
					icmsFcpValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vFCP,
					icmsUfDestinationValue:
						parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vICMSUFDest,
					otherValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vOutro,
					additionalInformation: [
						parsed.data.nfeProc.NFe.infNFe.infAdic?.infCpl,
						parsed.data.nfeProc.NFe.infNFe.infAdic?.infAdFisco,
					]
						.filter(Boolean)
						.join(" - "),
					status: "PendenteXml",
				},
				{ client: trx },
			);

			await receiptXml
				.merge({ receipt_id: newReceipt.id })
				.useTransaction(trx)
				.save();

			const items = SharedService.ArrayUnion(
				parsed.data.nfeProc.NFe.infNFe.det,
				(val) => val,
			);
			const itemData: Array<Partial<ReceiptItem>> = [];

			// eslint-disable-next-line no-restricted-syntax
			for (const itemIdx in items) {
				const item = items[itemIdx];
				const barcode = item.prod.cEAN;

				const existingProduct = supplierProducts.find(
					(sp) => sp.productVariation.barcode === barcode,
				)?.productVariation.product;

				const anotherExistingProduct = existingProduct
					? existingProduct
					: products.find((p) =>
							p.variations.find((pv) => pv.barcode === barcode),
						);

				const cofins = this.getCofins(
					parsed.data,
					Number.parseInt(itemIdx, 10),
				);
				const pis = this.getPis(parsed.data, Number.parseInt(itemIdx, 10));
				const icms = this.getIcms(parsed.data, Number.parseInt(itemIdx, 10));

				itemData.push({
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					receipt_id: newReceipt.id,

					quantity: new Decimal(item.prod.qCom),
					fractionValue: anotherExistingProduct
						? anotherExistingProduct.fractionValue
						: undefined,
					costValue: item.prod.vUnCom,
					unitaryValue: item.prod.vUnCom,
					discountValue: item.prod.vDesc,
					totalValue: item.prod.vProd - (item.prod.vDesc ?? 0),
					status: "PendenteXml",
					issueDate: DateTime.now(),

					// tax_operation_id: rule?.tax_operation_id,
					fiscalOperationCode: item.prod.CFOP,

					productSupplierXml: item.prod.cProd,
					barcodeXml: item.prod.cEAN,
					descriptionXml: item.prod.xProd,
					ncmXml: item.prod.NCM,

					icmsOriginProduct: icms?.orig,
					icmsCst:
						"CSOSN" in icms ? icms.CSOSN : "CST" in icms ? icms.CST : undefined,
					icmsBase: "vBC" in icms ? icms.vBC : undefined,
					icmsPercentage: "pICMS" in icms ? icms.pICMS : undefined,
					icmsValue: "vICMS" in icms ? icms.vICMS : undefined,
					icmsDeferredValue: "vICMSDif" in icms ? icms.vICMSDif : undefined,
					// icmsPercentageRedAliquot: rule?.icmsPercRedAliquota,
					icmsPercentageRedBase: "pRedBC" in icms ? icms.pRedBC : undefined,
					icmsStBase:
						"vBCSTRet" in icms
							? icms.vBCSTRet
							: "vBCST" in icms
								? icms.vBCST
								: undefined,
					icmsStPercentageRedBase:
						"pRedBCST" in icms ? icms.pRedBCST : undefined,
					icmsStIva: "pMVAST" in icms ? icms.pMVAST : undefined,
					icmsStPercentageUfDestination:
						"pICMSSTRet" in icms
							? // @ts-ignore check if things will work
								icms.pICMSSTRet
							: "pICMSST" in icms
								? icms.pICMSST
								: undefined,
					icmsStValue:
						"vICMSSTRet" in icms
							? icms.vICMSSTRet
							: "vICMSST" in icms
								? icms.vICMSST
								: undefined, // vICMSSTRet ?
					// icmsPartitionValue: 0,
					// icmsFcpPercentage: 0,
					// icmsFcpValue: 0,
					// icmsPartitionOriginUfPercentage: rule?.icmsPerc,
					// icmsPartitionDestinationUfPercentage: ufIcms?.icmsPercentage,
					// icmsPartitionInterUfPercentage: ufIcms?.icmsPercentage,
					icmsExoneratedValue:
						"vICMSDeson" in icms ? icms.vICMSDeson : undefined,
					icmsOperationValue: "vICMSOp" in icms ? icms.vICMSOp : undefined,
					icmsPercentageDeferred: "pDif" in icms ? icms.pDif : undefined,
					// icmsCreditValue: "vCredICMSSN" in icms ? icms.vCredICMSSN : undefined,
					// icmsCreditPercentage: "pCredSN" in icms ? icms.pCredSN : undefined,

					// issCst: rule?.icmsCst,
					// issBase: icmsBase,
					// issPercentage: rule?.icmsPerc,
					// issValue: (icmsBase * (rule?.icmsPerc ?? 1)) / 100,

					pisCst: pis.CST,
					pisBase: pis.vBC ? Number.parseFloat(pis.vBC.toString()) : undefined,
					pisPercentage: pis.pPIS
						? Number.parseFloat(pis.pPIS.toString())
						: undefined,
					pisValue: pis.vPIS
						? Number.parseFloat(pis.vPIS.toString())
						: undefined,
					pisRetentionValue: 0,

					cofinsCst: cofins.CST,
					cofinsBase: cofins.vBC
						? Number.parseFloat(cofins.vBC.toString())
						: undefined,
					cofinsPercentage: cofins.pCOFINS
						? Number.parseFloat(cofins.pCOFINS.toString())
						: undefined,
					cofinsValue: cofins.vCOFINS
						? Number.parseFloat(cofins.vCOFINS.toString())
						: undefined,
					cofinsRetentionValue: 0,

					// ipiCst: rule?.ipiCst,
					// ipiBase: 0,
					// ipiPercentage: rule?.ipiPerc,
					// ipiValue: 0,
				});
			}

			await ReceiptItem.createMany(itemData, { client: trx });

			await IssuedFiscalDocument.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					user_who_authorized_id: authCtx.user.id,
					bill_id: newReceipt.id,
					fiscal_document_id: undefined,

					movementType: BusinessUnitFiscalDocumentMovementType.E,
					model: parsed.data.nfeProc.NFe.infNFe.ide.mod,
					series: parsed.data.nfeProc.NFe.infNFe.ide.serie,
					sequence: parsed.data.nfeProc.NFe.infNFe.ide.nNF,
					purpose: "Importação XML",
					accessKey: parsed.data.nfeProc.protNFe.infProt.chNFe,
					authorizationDate: DateTime.fromISO(
						parsed.data.nfeProc.NFe.infNFe.ide.dhEmi,
					),
					authorizationReceiptDate: DateTime.fromISO(
						parsed.data.nfeProc.protNFe.infProt.dhRecbto,
					),
					authorizationReceipt: parsed.data.nfeProc.protNFe.infProt.nProt,
					contingency: IssuedFiscalDocumentContingency.N,
					active: true,

					sefazStatusCode: parsed.data.nfeProc.protNFe.infProt.cStat,
					sefazStatus: "Autorizado",
					sefazMessage: parsed.data.nfeProc.protNFe.infProt.xMotivo,
				},
				{ client: trx },
			);

			await this.$syncItems(trx, newReceipt);

			return newReceipt;
		});
	}

	private async $syncItems(trx: TransactionClientContract, receipt: Receipt) {
		await Database.rawQuery(
			`update receipt_items set product_variation_id = sp.product_variation_id
      from receipt_items ri
        join receipts r on ri.receipt_id = r.id
          join supplier_products sp on ri.product_supplier_xml = sp.product_supplier_id and r.supplier_id = sp.supplier_id
      where ri.receipt_id = ?
      and receipt_items.id = ri.id
      and receipt_items.product_variation_id is null;`,
			[receipt.id],
		).useTransaction(trx);

		await Database.rawQuery(
			`update receipt_items set product_variation_id = pv.id
      from receipt_items ri join product_variations pv on ri.barcode_xml = pv.barcode and ( coalesce(pv.barcode,'') <> '' and pv.barcode <> 'SEM GTIN')
      where ri.receipt_id = ?
      and receipt_items.id = ri.id
      and receipt_items.product_variation_id is null;`,
			[receipt.id],
		).useTransaction(trx);
	}

	private getIcms(data: z.infer<typeof schema>, idx: number) {
		const row = Array.isArray(data.nfeProc.NFe.infNFe.det)
			? data.nfeProc.NFe.infNFe.det[idx].imposto?.ICMS
			: data.nfeProc.NFe.infNFe.det.imposto?.ICMS;

		if (row?.ICMS00) return row.ICMS00;

		if (row?.ICMS10) return row.ICMS10;

		if (row?.ICMS20) return row.ICMS20;

		if (row?.ICMS30) return row.ICMS30;

		if (row?.ICMS40) return row.ICMS40;

		if (row?.ICMS51) return row.ICMS51;

		if (row?.ICMS60) return row.ICMS60;

		if (row?.ICMS70) return row.ICMS70;

		if (row?.ICMS90) return row.ICMS90;

		if (row?.ICMSSN101) return row.ICMSSN101;

		if (row?.ICMSSN102) return row.ICMSSN102;

		if (row?.ICMSSN201) return row.ICMSSN201;

		if (row?.ICMSSN202) return row.ICMSSN202;

		if (row?.ICMSSN500) return row.ICMSSN500;

		if (row?.ICMSSN900) return row.ICMSSN900;

		throw new BadRequestException("ICMS não encontrado", 400, "E_NO_ICMS");
	}

	private getCofins(data: z.infer<typeof schema>, idx: number) {
		const row = Array.isArray(data.nfeProc.NFe.infNFe.det)
			? data.nfeProc.NFe.infNFe.det[idx].imposto?.COFINS
			: data.nfeProc.NFe.infNFe.det.imposto?.COFINS;

		if (row?.COFINSAliq) {
			return row.COFINSAliq;
		}

		if (row?.COFINSQtde) {
			return row.COFINSQtde;
		}

		if (row?.COFINSNT) {
			return row.COFINSNT;
		}

		if (row?.COFINSOutr) {
			return row.COFINSOutr;
		}

		throw new BadRequestException("Cofins não encontrado", 400, "E_NO_COFINS");
	}

	private getPis(data: z.infer<typeof schema>, idx: number) {
		const row = Array.isArray(data.nfeProc.NFe.infNFe.det)
			? data.nfeProc.NFe.infNFe.det[idx].imposto?.PIS
			: data.nfeProc.NFe.infNFe.det.imposto?.PIS;

		if (row?.PISAliq) {
			return row.PISAliq;
		}

		if (row?.PISQtde) {
			return row.PISQtde;
		}

		if (row?.PISNT) {
			return row.PISNT;
		}

		if (row?.PISOutr) {
			return row.PISOutr;
		}

		throw new BadRequestException("Pis não encontrado", 400, "E_NO_PIS");
	}

	private async getDailyMovementForImport(
		trx: TransactionClientContract,
		authCtx: AuthContext,
	): Promise<string> {
		const dailyMovement = authCtx.unit.unitConfig.lockedDailyMovementDate
			? await DailyMovement.query()
					.useTransaction(trx)
					.where("business_unit_id", authCtx.unit.id)
					.whereRaw("opening_date::date = ?", [new Date()])
					.where("status", DailyMovementStatus.A)
					.first()
			: await DailyMovement.query()
					.useTransaction(trx)
					.where("business_unit_id", authCtx.unit.id)
					.where("status", DailyMovementStatus.A)
					.first();

		if (!dailyMovement) {
			throw new BadRequestException(
				"E_NO_DL: É necessário ter um movimento diário para importar uma nota",
				400,
				"E_NO_DL",
			);
		}

		return dailyMovement.id;
	}

	// private async getProductVariationForImport(
	// 	trx: TransactionClientContract,
	// 	data: z.infer<typeof schema>,
	// 	supplierId: string,
	// 	authCtx: AuthContext,
	// ): Promise<string[]> {
	// 	throw new BadRequestException("Não deve ser chamado", 400, "E_NO_PV");
	//
	// 	const sanitized = Array.isArray(data.nfeProc.NFe.infNFe.det)
	// 		? data.nfeProc.NFe.infNFe.det
	// 		: [data.nfeProc.NFe.infNFe.det];
	//
	// 	const items = SharedService.ArrayUnion(
	// 		sanitized.map((d) => d.prod),
	// 		(val) => val,
	// 	);
	//
	// 	const uniqueItems = items.reduce((acc, current) => {
	// 		if (!acc.includes(current.cEAN)) {
	// 			acc.push(current.cEAN);
	// 		}
	//
	// 		// if (!acc.includes(current.cEANTrib)) {
	// 		// 	acc.push(current.cEANTrib);
	// 		// }
	//
	// 		return acc;
	// 	}, [] as string[]);
	//
	// 	const supplierProducts = await SupplierProduct.query()
	// 		.useTransaction(trx)
	// 		.where("economic_group_id", authCtx.group.id)
	// 		.where("supplier_id", supplierId)
	// 		.whereIn("product_supplier_id", uniqueItems);
	//
	// 	// every item has a supplier product
	// 	if (supplierProducts.length === uniqueItems.length) {
	// 		return supplierProducts.map((elem) => elem.produt_variation_id);
	// 	}
	//
	// 	const prodVariations = await ProductVariation.query()
	// 		.useTransaction(trx)
	// 		.whereIn("barcode", uniqueItems);
	// 	if (prodVariations.length === uniqueItems.length) {
	// 		return prodVariations.map((elem) => elem.id);
	// 	}
	//
	// 	const products = await Product.fetchOrCreateMany(
	// 		["economic_group_id", "ncm"],
	// 		items.map((elem) => ({
	// 			economic_group_id: authCtx.group.id,
	//
	// 			description: elem.xProd,
	// 			type: ProductType.PRODUCT,
	// 			ncm: elem.NCM,
	// 			active: true,
	// 		})),
	// 		{ client: trx },
	// 	);
	//
	// 	const variationTasks = products.map((elem) => {
	// 		return elem.related("variations").fetchOrCreateMany(
	// 			items.map((inner) => ({ barcode: inner.cEAN })),
	// 			["barcode"],
	// 			{ client: trx },
	// 		);
	// 	});
	// 	const variations = await Promise.all(variationTasks);
	//
	// 	const units = await BusinessUnit.query()
	// 		.useTransaction(trx)
	// 		.where("economic_group_id", authCtx.group.id)
	// 		.select("id");
	//
	// 	// iterate over each
	// 	const pData: Array<Partial<BusinessUnitProduct>> = [];
	// 	// eslint-disable-next-line no-restricted-syntax
	// 	for (const variation of variations.flat()) {
	// 		// eslint-disable-next-line no-restricted-syntax
	// 		for (const unit of units) {
	// 			// eslint-disable-next-line no-restricted-syntax
	// 			for (const item of items) {
	// 				pData.push({
	// 					businness_unit_id: unit.id,
	// 					product_variation_id: variation.id,
	// 					stock: 0,
	// 					maximumStock: 0,
	// 					minimumStock: 0,
	// 					maximumDiscountPercentage: 100,
	// 					maximumDiscountValue: 0,
	// 					price: 0,
	// 					costPrice: item.vUnCom,
	// 					profitMargin: 0,
	// 					commission: 0,
	// 					meta: 0,
	// 					metaType: undefined,
	// 					commissionMeta: 0,
	// 				});
	// 			}
	// 		}
	// 	}
	// 	await BusinessUnitProduct.fetchOrCreateMany(
	// 		["businness_unit_id", "product_variation_id"],
	// 		pData,
	// 		{ client: trx },
	// 	);
	//
	// 	return variations.flat().map((elem) => elem.id);
	// }

	private async getSupplierForImport(
		trx: TransactionClientContract,
		data: z.infer<typeof schema>,
		authCtx: AuthContext,
	): Promise<string> {
		const existingTutor = await PatientTutor.query()
			.useTransaction(trx)
			.where("document", data.nfeProc.NFe.infNFe.emit.CNPJ)
			.first();

		// vendedor não existe
		if (!existingTutor) {
			// const suppliers = await authCtx.group
			// 	.related("patients")
			// 	.query()
			// 	.useTransaction(trx)
			// 	.where("type", PatientType.SUPPLIER)
			// 	.select("id");
			const [{ next_id = 1 }] = await Database.from("economic_groups")
				.select(Database.raw(`max(coalesce(tag, '0')::int) + 1 as next_id`))
				.joinRaw(
					"left join patient_economic_groups on economic_groups.id = patient_economic_groups.economic_group_id",
				)
				.joinRaw(
					"left join patients on patient_economic_groups.patient_id = patients.id",
				)
				.where("economic_groups.id", authCtx.group.id);

			const newSupplier = await Patient.create(
				{
					name: data.nfeProc.NFe.infNFe.emit.xFant,
					type: PatientType.SUPPLIER,
					tag: next_id.toString(),
				},
				{ client: trx },
			);

			await newSupplier.related("tutor").create({
				document: data.nfeProc.NFe.infNFe.emit.CNPJ,
				inscription: data.nfeProc.NFe.infNFe.emit.IE,
				corporateName: data.nfeProc.NFe.infNFe.emit.xNome,
				cellphone: data.nfeProc.NFe.infNFe.emit.enderEmit.fone,
				telephone: data.nfeProc.NFe.infNFe.emit.enderEmit.fone,
				postalCode: data.nfeProc.NFe.infNFe.emit.enderEmit.CEP,
				street: data.nfeProc.NFe.infNFe.emit.enderEmit.xLgr,
				number: data.nfeProc.NFe.infNFe.emit.enderEmit.nro,
				// complement: data.nfeProc.NFe.infNFe.emit.enderEmit.xCpl,
				district: data.nfeProc.NFe.infNFe.emit.enderEmit.xBairro,
				city: data.nfeProc.NFe.infNFe.emit.enderEmit.xMun,
				state: data.nfeProc.NFe.infNFe.emit.enderEmit.UF,
				cityCode: data.nfeProc.NFe.infNFe.emit.enderEmit.cMun,
				residence: "COMERCIAL",
			});

			await authCtx.group.related("patients").attach([newSupplier.id], trx);

			return newSupplier.id;
		}

		// checar se vendedor tem relação com grupo
		const tmpPatient = await authCtx.group
			.related("patients")
			.query()
			.useTransaction(trx)
			.where("patient_id", existingTutor.patient_id)
			.first();

		// se não tiver, criar relação
		if (!tmpPatient) {
			await authCtx.group
				.related("patients")
				.attach([existingTutor.patient_id], trx);
		}

		return existingTutor.patient_id;
	}

	async createReceipt(
		authCtx: AuthContext,
		data: {
			supplierId: string;
			dailyMovementId?: string;
			reversalUserId?: string;
			reversalReasonId?: string;
			receiptDate: DateTime;
			otherValue?: number;
			additionalInformation?: string;
			reversalObservation?: string;
			reversedAt?: DateTime;

			items: Array<{
				productVariationId: string;
				quantity: number;
				costValue: number;
				unitaryValue: number;
				discountValue: number;
			}>;
		},
	) {
		return await Database.transaction(async (trx) => {
			const counter = await Receipt.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id);

			const dailyCashier = await this.sharedService.getContextCashier(
				authCtx,
				trx,
				true,
			);
			const dailyMovement = await this.sharedService.getContextMovement(
				authCtx,
				trx,
				true,
			);

			const receipt = await Receipt.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					supplier_id: data.supplierId,
					user_id: authCtx.user.id,
					seller_id: authCtx.user.id,
					daily_cashier_id: dailyCashier?.id,
					daily_movement_id: dailyMovement?.id,
					reversal_user_id: data.reversalUserId,
					reversal_reason_id: data.reversalReasonId,

					origin: "Manual",
					tag: GenerateTag(counter.length + 1),
					issueDate: DateTime.now(),
					receiptDate: data.receiptDate,
					otherValue: data.otherValue,
					additionalInformation: data.additionalInformation,
					reversalObservation: data.reversalObservation,
					reversedAt: data.reversedAt,
					status: "Aberta",
				},
				{ client: trx },
			);

			const tasks = data.items.map((elem) => {
				return this.innerCreateItem(trx, authCtx, {
					receiptId: receipt.id,
					productVariationId: elem.productVariationId,
					quantity: elem.quantity,
					costValue: elem.unitaryValue,
					unitaryValue: elem.unitaryValue,
					discountValue: elem.discountValue,
				});
			});
			await Promise.all(tasks);

			await this.syncReceipt(trx, receipt);

			return receipt;
		});
	}

	async createItem(
		authCtx: AuthContext,
		data: {
			receiptId: string;
			productVariationId: string;
			quantity: number;
			costValue: number;
			unitaryValue: number;
			discountValue: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const receipt = await Receipt.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.receiptId)
				.first();

			if (!receipt) {
				throw this.sharedService.ResourceNotFound();
			}

			await this.innerCreateItem(trx, authCtx, data);

			await this.syncReceipt(trx, receipt);
		});
	}

	private async innerCreateItem(
		trx: TransactionClientContract,
		authCtx: AuthContext,
		data: {
			receiptId: string;
			productVariationId: string;
			quantity: number;
			costValue: number;
			unitaryValue: number;
			discountValue: number;
		},
	) {
		const productVariation = await ProductVariation.query()
			.useTransaction(trx)
			.where("id", data.productVariationId)
			.whereHas("businessUnitProducts", (query) => {
				query.where("businness_unit_id", authCtx.unit.id);
			})
			.preload("product")
			.preload("businessUnitProducts", (query) => {
				query.where("businness_unit_id", authCtx.unit.id);
			})
			.first();

		if (!productVariation) {
			throw new BadRequestException(
				"Não foi possível encontrar um preço para esse produto",
				400,
				"E_NO_VARIATION",
			);
		}

		const rule = await TaxationGroupRule.query()
			.useTransaction(trx)
			.whereHas("taxationGroup", (query) => {
				query.where("id", productVariation.product.taxation_group_id);
			})
			.where("movementType", MovementType.E)
			.where("movementCategory", MovementCategory.NE)
			.where("fromUf", authCtx.unit.state ?? "-")
			.where("toUf", authCtx.unit.state ?? "-")
			.preload("taxationGroup")
			.preload("taxOperation")
			.first();

		// const ufIcms = await UfIcms.query()
		// 	.useTransaction(trx)
		// 	.where("origin_uf", rule?.toUf ?? "-")
		// 	.where("destination_uf", rule?.toUf ?? "-")
		// 	.first();
		//
		// const totalValue = data.unitaryValue * data.quantity - data.discountValue;
		// const icmsBase =
		// 	totalValue * ((100 - (rule?.icmsPercRedBaseCalculo ?? 0)) / 100);
		// const icmsValue = (icmsBase * (rule?.icmsPerc ?? 0)) / 100;
		// const icmsStBase_1 = icmsBase + (icmsBase * (rule?.ivaIcmsSt ?? 0)) / 100;
		// const icmsStPercentageRedBase = rule?.ivaIcmsSt
		// 	? rule?.icmsPercRedBaseCalculoST
		// 	: undefined;
		// const icmsStBase_2 = rule?.ivaIcmsSt
		// 	? icmsStBase_1 - (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
		// 	: 0;

		return ReceiptItem.create(
			{
				economic_group_id: authCtx.group.id,
				business_unit_id: authCtx.unit.id,
				product_variation_id: data.productVariationId,
				receipt_id: data.receiptId,

				quantity: new Decimal(data.quantity),
				costValue: data.costValue,
				unitaryValue: data.unitaryValue,
				discountValue: data.discountValue,
				totalValue: data.unitaryValue * data.quantity - data.discountValue,
				fractionValue: productVariation.product.fractionValue,
				status: "Ativo",
				issueDate: DateTime.now(),

				tax_operation_id: rule?.tax_operation_id,
				fiscalOperationCode: rule?.taxOperation?.code,

				// icmsOriginProduct: productVariation.product.icmsOrigin,
				// icmsCst: rule?.icmsCst,
				// icmsBase,
				// icmsPercentage: rule?.icmsPerc,
				// icmsValue,
				// icmsDeferredValue: 0,
				// icmsPercentageRedAliquot: rule?.icmsPercRedAliquota,
				// icmsPercentageRedBase: rule?.icmsPercRedBaseCalculo,
				// icmsStBase: this.sharedService.isValidNumber(rule?.ivaIcmsSt)
				// 	? icmsStBase_2
				// 	: undefined,
				// icmsStPercentageRedBase: rule?.icmsPercRedBaseCalculo,
				// icmsStIva: rule?.icmsPercRedAliquota,
				// icmsStPercentageUfDestination: ufIcms?.icmsPercentage,
				// icmsStValue:
				// 	this.sharedService.isValidNumber(rule?.ivaIcmsSt) && ufIcms
				// 		? icmsStBase_2 * (ufIcms.icmsPercentage / 100) - icmsValue
				// 		: undefined,
				// icmsPartitionValue: 0,
				// icmsFcpPercentage: rule?.fcpPerc,
				// icmsFcpValue: 0,
				// icmsPartitionOriginUfPercentage: rule?.icmsPerc,
				// icmsPartitionDestinationUfPercentage: ufIcms?.icmsPercentage,
				// icmsPartitionInterUfPercentage: ufIcms?.icmsPercentage,
				//
				// issCst: rule?.icmsCst,
				// issBase: icmsBase,
				// issPercentage: rule?.icmsPerc,
				// issValue: (icmsBase * (rule?.icmsPerc ?? 1)) / 100,
				//
				// pisCst: rule?.pisCst,
				// pisBase: totalValue,
				// pisPercentage: rule?.pisPerc,
				// pisValue: (totalValue * (rule?.pisPerc ?? 1)) / 100,
				// pisRetentionValue: 0,
				//
				// cofinsCst: rule?.cofinsCst,
				// cofinsBase: totalValue,
				// cofinsPercentage: rule?.cofinsPerc,
				// cofinsValue: (totalValue * (rule?.cofinsPerc ?? 1)) / 100,
				// cofinsRetentionValue: 0,
				//
				// ipiCst: rule?.ipiCst,
				// ipiBase: 0,
				// ipiPercentage: rule?.ipiPerc,
				// ipiValue: 0,
			},
			{
				client: trx,
			},
		);
	}

	async createPayment(
		authCtx: AuthContext,
		data: {
			receiptId: string;
			items: {
				paymentMethodId: string;
				tefAcquirerId?: string;
				tefFlagId?: string;
				accountPlanId?: string;

				installments: number;
				installmentValue: number;
				issueDate: DateTime;
				expirationDate: DateTime;
				nsuDocument?: string;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			const receipt = await Receipt.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.receiptId)
				.preload("payments")
				.first();

			if (!receipt) {
				throw this.sharedService.ResourceNotFound();
			}

			const sum = this.sharedService.sum(
				data.items.map((i) => i.installmentValue),
			);

			const decimalTotal = new Decimal(receipt.totalValue.toString());
			const decimalSum = new Decimal(sum);
			const decimalPaid = new Decimal(receipt.paidValue.toString());

			if (decimalTotal.minus(decimalPaid).lessThan(decimalSum)) {
				throw new BadRequestException(
					"Valores adicionais acima do valor total da nota",
					400,
					"E_INVALID",
				);
			}

			const paymentMethods = await PaymentMethod.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					data.items.map((i) => i.paymentMethodId),
				);

			const tasks = data.items.map((elem, index) => {
				return ReceiptPayment.createMany(
					Array.from<number, Partial<ReceiptPayment>>(
						{ length: elem.installments },
						(_, idx) => {
							const paymentMethod = paymentMethods.find(
								(p) => p.id === elem.paymentMethodId,
							) as PaymentMethod;

							return {
								economic_group_id: authCtx.group.id,
								business_unit_id: authCtx.unit.id,
								receipt_id: data.receiptId,
								payment_method_id: elem.paymentMethodId,
								tef_acquirer_id: elem.tefAcquirerId,
								tef_flag_id: elem.tefFlagId,

								installment: idx + 1,
								block: index + 1 + receipt.payments.length,
								blockInstallments: elem.installments,
								installmentValue: elem.installmentValue / elem.installments,
								issueDate: elem.issueDate,
								expirationDate: SharedService.CalculateDateOffset(
									idx,
									elem.expirationDate,
									paymentMethod,
								),
								nsuDocument: elem.nsuDocument,
								status: "Ativo",
							};
						},
					),

					{ client: trx },
				);
			});

			const payments = await Promise.all(tasks);

			if (!authCtx.unit.unitConfig.generatesFinancesOnReceiptsFinish) {
				const paymentsTasks = payments.flat().map((elem, idx) => {
					// if (elem.installment !== 1) {
					// 	return Promise.resolve(-1);
					// }

					return this.createFinanceEntry(trx, authCtx, {
						dailyCashierId: receipt.daily_cashier_id,
						dailyMovementId: receipt.daily_movement_id,
						supplierId: receipt.supplier_id,
						paymentMethodId: elem.payment_method_id,
						tefAcquirerId: elem.tef_acquirer_id,
						tefFlagId: elem.tef_flag_id,
						accountPlanId: data.items.at(idx)?.accountPlanId,

						tag: receipt.tag,
						item: elem,
					});
				});
				await Promise.all(paymentsTasks);
			}

			await receipt
				.merge({
					paidValue:
						receipt.paidValue +
						this.sharedService.sum(data.items.map((i) => i.installmentValue)),
				})
				.useTransaction(trx)
				.save();
		});
	}

	async updatePayment(
		authCtx: AuthContext,
		data: {
			items: {
				receiptPaymentId: string;
				paymentMethodId: string;
				tefFlagId?: string;
				tefAcquirerId?: string;
				installmentValue: number;
				expirationDate: DateTime;
				nsuDocument?: string;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			const payments = await ReceiptPayment.query()
				.useTransaction(trx)
				.whereHas("receipt", (query) => {
					query
						.where("economic_group_id", authCtx.group.id)
						.where("business_unit_id", authCtx.unit.id);
				})
				.whereIn(
					"id",
					data.items.map((elem) => elem.receiptPaymentId),
				);

			if (payments.length !== data.items.length) {
				throw new BadRequestException(
					"Não foi possível encontrar todos os pagamentos",
					400,
					"E_NO_PAYMENT",
				);
			}

			const updateTasks = data.items.map((item) => {
				return ReceiptPayment.query()
					.useTransaction(trx)
					.where("id", item.receiptPaymentId)
					.update({
						payment_method_id: item.paymentMethodId,
						tef_acquirer_id: item.tefAcquirerId,
						tef_flag_id: item.tefFlagId,
						installmentValue: item.installmentValue,
						expirationDate: item.expirationDate,
						nsuDocument: item.nsuDocument,
					});
			});
			await Promise.all(updateTasks);

			const updatedPayments = await ReceiptPayment.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					data.items.map((elem) => elem.receiptPaymentId),
				)
				.preload("receipt");

			const uniqueReceipts = updatedPayments.reduce((acc, current) => {
				if (!acc.find((elem) => elem.id === current.receipt.id)) {
					acc.push(current.receipt);
				}
				return acc;
			}, [] as Receipt[]);

			const tasks = uniqueReceipts.map(async (elem) => {
				const receiptPayments = await ReceiptPayment.query()
					.useTransaction(trx)
					.where("receipt_id", elem.id)
					.where("status", "Ativo" as TReceiptPaymentStatus);

				await elem
					.merge({
						paidValue: this.sharedService.sum(
							receiptPayments.map((p) => p.installmentValue),
						),
					})
					.useTransaction(trx)
					.save();
			});
			await Promise.all(tasks);

			const checkTasks = uniqueReceipts.map(async (elem) => {
				const updated = await elem.refresh();

				const decimalTotal = new Decimal(updated.totalValue.toString());
				const decimalPaid = new Decimal(updated.paidValue.toString());

				if (decimalTotal.lessThan(decimalPaid)) {
					throw new BadRequestException(
						`Valores adicionais acima do valor total da nota ${updated.tag}`,
						400,
						"E_INVALID",
					);
				}
			});
			await Promise.all(checkTasks);
		});
	}

	async finishReceiptImport(
		authCtx: AuthContext,
		data: {
			receiptId: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const receipt = await Receipt.query()
				.useTransaction(trx)
				.preload("items")
				.preload("payments")
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.receiptId)
				.first();

			if (!receipt) {
				throw this.sharedService.ResourceNotFound();
			}

			if (receipt.status === "Baixada") {
				throw new BadRequestException(
					"Esta Nota já está baixada",
					400,
					"E_NOTA_FINALIZADA",
				);
			}

			if (receipt.status === "PendenteXml") {
				if (receipt.items.some((i) => !i.product_variation_id)) {
					throw new BadRequestException(
						"Existem itens da nota que ainda não possuem produto relacionado",
						400,
						"E_NO_VARIATION",
					);
				}
			}

			if (receipt.payments.length === 0) {
				throw new BadRequestException(
					"É necessário completar os dados dos pagamentos da Nota de Entrada",
					400,
					"E_NO_PAYMENT",
				);
			}

			if (receipt.payments.some((p) => !p.payment_method_id)) {
				throw new BadRequestException(
					"É necessário completar os dados dos pagamentos da Nota de Entrada",
					400,
					"E_NO_PAYMENT",
				);
			}

			if (receipt.paidValue !== receipt.totalValue) {
				throw new BadRequestException(
					"Os pagamentos lançados na Nota de Entrada não inferiores ao Valor Total da Entrada. Complete os pagamentos antes de finalizar a Entrada",
					400,
					"E_NO_PAYMENT",
				);
			}

			if (authCtx.unit.unitConfig.generatesFinancesOnReceiptsFinish) {
				const paymentsTasks = receipt.payments.map((elem) => {
					return this.createFinanceEntry(trx, authCtx, {
						dailyCashierId: receipt.daily_cashier_id,
						dailyMovementId: receipt.daily_movement_id,
						supplierId: receipt.supplier_id,
						paymentMethodId: elem.payment_method_id,
						tefAcquirerId: elem.tef_acquirer_id,
						tefFlagId: elem.tef_flag_id,

						tag: receipt.tag,
						item: elem,
					});
				});
				await Promise.all(paymentsTasks);
			}

			await receipt
				.merge({
					status: "Baixada",
				})
				.useTransaction(trx)
				.save();

			await receipt
				.related("items")
				.query()
				.useTransaction(trx)
				.update({
					status: "Ativo" as TReceiptItemStatus,
				});

			await Database.rawQuery(
				`insert into deposit_items (deposit_id, business_unit_product_id, product_variation_id, quantity, status, created_at, updated_at)
        select distinct ${authCtx.unit.unitConfig.incoming_deposit_id}, bup.id, bup.product_variation_id, 0, 'Ativo', now(), now()
        from receipt_items ri
          join business_unit_products bup
            on ri.product_variation_id = bup.product_variation_id and ri.business_unit_id = bup.businness_unit_id
        where ri.receipt_id = ?
          and ri.product_variation_id not in (select distinct product_variation_id from deposit_items where deposit_id = ${authCtx.unit.unitConfig.incoming_deposit_id})`,
				[receipt.id],
			)
				.useTransaction(trx)
				.exec();

			await Database.rawQuery(
				`update deposit_items set quantity =
(
    select (avg(di.quantity) + sum(ri.quantity * ri.fraction_value))
    from deposit_items di
      join deposits d on di.deposit_id = d.id
      join receipt_items ri on ri.product_variation_id = di.product_variation_id and ri.business_unit_id = d.business_unit_id
      join business_unit_configs buc on buc.business_unit_id = d.business_unit_id and d.id = buc.incoming_deposit_id
    where ri.receipt_id = ?
      and deposit_items.id = di.id
    group by di.product_variation_id
          )
where deposit_id = ?
and product_variation_id in (
    select distinct product_variation_id from receipt_items where receipt_id = ? and disabled_date is null
)`,
				[receipt.id, authCtx.unit.unitConfig.incoming_deposit_id, receipt.id],
			)
				.useTransaction(trx)
				.exec();
		});
	}

	async reopenReceipt(
		authCtx: AuthContext,
		data: {
			receiptId: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const receipt = await Receipt.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.receiptId)
				.first();

			if (!receipt) {
				throw this.sharedService.ResourceNotFound();
			}

			if (receipt.status !== "Baixada") {
				throw new BadRequestException(
					"Esta Nota não está baixada",
					400,
					"E_NOTA_FINALIZADA",
				);
			}

			const rows = await Database.from("finances")
				.useTransaction(trx)
				.select("finances.id")
				.whereRaw(
					"finances.origin_id in (select id from receipt_payments rp where receipt_id = ?)",
					[receipt.id],
				)
				.where("finances.status", FinanceStatus.B)
				.whereNull("finances.deleted_at")
				.where("finances.origin_flag", FinanceOriginFlag.E);
			if (rows.length > 0) {
				throw new BadRequestException(
					"Já existem títulos baixados que são referentes a esta entrada;",
					400,
					"E_INVALID",
				);
			}

			const otherRows = await Database.rawQuery(
				`select
	di.id,
	p.description
from
	deposit_items di
join business_unit_configs buc on
	di.deposit_id = buc.incoming_deposit_id
join product_variations pv on
	pv.id = di.product_variation_id
join products p on
	p.id = pv.product_id
where
	buc.business_unit_id = ?
	and di.quantity < (
	select
		(ri.quantity * ri.fraction_value)
	from
		receipt_items ri
	where
		ri.receipt_id = ?
		and di.product_variation_id = ri.product_variation_id);`,
				[authCtx.unit.id, receipt.id],
			)
				.useTransaction(trx)
				.exec();
			if (otherRows.length > 0) {
				throw new BadRequestException(
					`Não existe quantidade suficiente no Deposito de Estoque para fazer a Reabertura da Nota de Entrada: ${otherRows
						.map((r) => r.description)
						.join(", ")}`,
					400,
					"E_ERR",
				);
			}

			await receipt
				.merge({
					status: "Aberta",
					reversal_user_id: authCtx.user.id,
					reversedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();

			if (authCtx.unit.unitConfig.generatesFinancesOnReceiptsFinish) {
				await Database.rawQuery(
					`delete
from
	finances
where
	finances.origin_id in (
	select
		id
	from
		receipt_payments rp
	where
		receipt_id = ?)`,
					[receipt.id],
				)
					.useTransaction(trx)
					.exec();
			}

			await Database.rawQuery(
				`update deposit_items set quantity =
(
    select (di.quantity - (ri.quantity * ri.fraction_value))
    from deposit_items di
      join deposits d on di.deposit_id = d.id
      join receipt_items ri on ri.product_variation_id = di.product_variation_id and ri.business_unit_id = d.business_unit_id
      join business_unit_configs buc on buc.business_unit_id = d.business_unit_id and d.id = buc.incoming_deposit_id
    where ri.receipt_id = ?
      and deposit_items.id = di.id
          )
where deposit_id = ?
and product_variation_id in (
    select product_variation_id from receipt_items where receipt_id = ?
)`,
				[receipt.id, authCtx.unit.unitConfig.incoming_deposit_id, receipt.id],
			)
				.useTransaction(trx)
				.exec();
		});
	}

	async deleteItem(
		authCtx: AuthContext,
		data: {
			itemId: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const thing = await ReceiptItem.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.itemId)
				.preload("receipt")
				.first();

			if (!thing) {
				throw this.sharedService.ResourceNotFound("Item não encontrado");
			}

			await thing
				.merge({
					disabled_user_id: authCtx.user.id,
					disabledDate: DateTime.now(),
					status: "Excluido",
				})
				.useTransaction(trx)
				.save();

			await this.syncReceipt(trx, thing.receipt);
		});
	}

	async deletePayment(
		authCtx: AuthContext,
		data: {
			receiptId: string;
			block: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const row = await Receipt.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.receiptId)
				.first();

			if (!row) {
				throw this.sharedService.ResourceNotFound("Item não encontrado");
			}

			const existingFinances = await Finance.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("origin_flag", FinanceOriginFlag.E)
				.where("document", `NFE-${row.tag}`)
				.where("block", data.block);

			// if (existingFinances.length === 0) {
			// 	throw new BadRequestException(
			// 		"Não foi possível encontrar o pagamento",
			// 		400,
			// 		"E_PAYMENT_NOT_FOUND",
			// 	);
			// }

			if (existingFinances.some((f) => f.status === FinanceStatus.B)) {
				throw new BadRequestException(
					"Não é possível excluir um pagamento que já foi baixado",
					400,
					"E_PAYMENT_ALREADY_RECEIVED",
				);
			}

			const payments = await ReceiptPayment.query()
				.useTransaction(trx)
				.where("receipt_id", data.receiptId)
				.where("block", data.block);

			await Finance.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					existingFinances.map((f) => f.id),
				)
				.update({
					status: FinanceStatus.E,
					deletedAt: DateTime.now(),
				});

			await ReceiptPayment.query()
				.useTransaction(trx)
				.where("receipt_id", data.receiptId)
				.where("block", data.block)
				.update({
					status: "Excluido" as TReceiptPaymentStatus,
				});

			await row
				.merge({
					paidValue:
						row.paidValue -
						this.sharedService.sum(payments.map((p) => p.installmentValue)),
				})
				.useTransaction(trx)
				.save();
		});
	}

	async searchProducts(
		authCtx: AuthContext,
		data: {
			variation?: string;
			reference?: string;
			barcode?: string;
			description?: string;
		},
	) {
		const qb = Product.query()
			.where("economic_group_id", authCtx.group.id)
			.where("type", ProductType.PRODUCT)
			.where("active", true);

		if (data.variation || data.barcode) {
			qb.whereHas("variations", (query) => {
				if (data.variation) {
					query.where("id", data.variation);
				}
				if (data.barcode) {
					query.where("barcode", "ilike", `%${data.barcode}%`);
				}
			});
		}

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		if (data.reference) {
			qb.where("referenceCode", "ilike", `%${data.reference}%`);
		}

		qb.preload("variations", (query) => {
			if (data.variation) {
				query.where("id", data.variation);
			}
			if (data.barcode) {
				query.where("barcode", "ilike", `%${data.barcode}%`);
			}

			query.where("active", true);
			query.preload("variationOptions");
			query.preload("product", (query) => {
				query.preload("unit");
				query.preload("fractionUnit");
			});

			query.preload("businessUnitProducts", (query) => {
				query.where("businness_unit_id", authCtx.unit.id);
			});
		});

		const products = await qb;

		const variations = products.flatMap((p) => p.variations);

		return variations.map((elem) => ({
			id: elem.id,
			product: {
				id: elem.product.id,
			},
			description: elem.product.description,
			unit: elem.product.unit,
			fractioned: elem.product.fractioned,
			fractionValue: elem.product.fractionValue,
			fractionUnit: elem.product.fractionUnit,
			stock:
				elem.businessUnitProducts.find(
					(p) => p.businness_unit_id === authCtx.unit.id,
				)?.stock ?? null,
			costPrice:
				elem.businessUnitProducts.find(
					(p) => p.businness_unit_id === authCtx.unit.id,
				)?.costPrice ?? null,
			referenceCode: elem.product.referenceCode,
			barcode: elem.barcode,
			variationOptions: elem.variationOptions,
		}));
	}

	async searchTax(
		authCtx: AuthContext,
		data: {
			origin?: string;
			destination?: string;
			variation?: string;
		},
	) {
		const qb = TaxationGroup.query()
			.where("economic_group_id", authCtx.group.id)
			.where("active", true);

		if (data.origin) {
			qb.whereHas("rules", (query) => {
				query.where("from_uf", data.origin as string);
			});
		}

		qb.whereHas("rules", (query) => {
			query.where("to_uf", data.destination ?? authCtx.unit.state ?? "-");
		});

		qb.whereHas("rules", (query) => {
			query.where("movement_type", MovementType.E);
		});

		qb.whereHas("rules", (query) => {
			query.where("movement_category", MovementCategory.NE);
		});

		qb.preload("rules", (query) => {
			query.preload("taxOperation");

			query.where("active", true);
			query.where("movement_type", MovementType.E);
			query.where("movement_category", MovementCategory.NE);

			if (data.origin) {
				query.where("from_uf", data.origin);
			}

			if (data.destination) {
				query.where("to_uf", data.destination);
			}
		});

		const result = await qb;

		return result
			.flatMap((tax) => tax.rules)
			.map((elem) => ({
				idOperacaoFiscal: elem.tax_operation_id,
				codOperacaoFiscal: elem.taxOperation?.code ?? null,
				codBeneficioFiscal: elem.taxBenefitCode,
				icmsCst: elem.icmsCst,
				icmsPerc: elem.icmsPerc,
				icmsPercRedAliquota: elem.icmsPercRedAliquota,
				icmsPercRedBaseCalculo: elem.icmsPercRedBaseCalculo,
				ivaIcmsSt: elem.ivaIcmsSt,
				icmsPercRedBaseCalculoST: elem.icmsPercRedBaseCalculoST,
				icmsPercDiferimento: elem.icmsPercDiferimento,
				ipiCst: elem.ipiCst,
				ipiPerc: elem.ipiPerc,
				pisCst: elem.pisCst,
				pisPerc: elem.pisPerc,
				cofinsCst: elem.cofinsCst,
				cofinsPerc: elem.cofinsPerc,
			}));
	}

	async searchPaymentMethods(authCtx: AuthContext) {
		const result = await PaymentMethod.query()
			.where("economic_group_id", authCtx.group.id)
			.where("active", true)
			.whereIn("usage", [PaymentMethodUsage.RECEBER, PaymentMethodUsage.AMBOS])
			.preload("flags", (query) => {
				query.preload("flag");
				query.preload("acquirer");
			})
			.preload("fees");

		return result.map((elem) => {
			if (elem.tef === PaymentMethodTef.N) {
				return {
					id: elem.id,
					description: elem.description,
					requiresDocument: elem.requiresDocument,
					daysFirstInstallment: elem.daysFirstInstallment,
					daysBetweenInstallments: elem.daysBetweenInstallments,
					allowChangeExpirationDate: elem.allowChangeExpirationDate,
				};
			}

			return {
				id: elem.id,
				description: elem.description,
				requiresDocument: elem.requiresDocument,
				daysFirstInstallment: elem.daysFirstInstallment,
				daysBetweenInstallments: elem.daysBetweenInstallments,
				allowChangeExpirationDate: elem.allowChangeExpirationDate,
				type: elem.type,
				flags: elem.flags.map((elem) => {
					return {
						id: elem.id,
						flagId: elem.flag.id,
						acquirerId: elem.acquirer.id,
					};
				}),
				fees: elem.fees.map((elem) => {
					return {
						id: elem.id,
						fee: elem.fee,
						installments: elem.installments,
					};
				}),
			};
		});
	}

	async createReceiptProducts(
		authCtx: AuthContext,
		data: {
			receiptId: string;
			receiptItemIds: number[];
		},
	) {
		await Database.transaction(async (trx) => {
			const row = await Receipt.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.receiptId)
				.first();

			if (!row) {
				throw this.sharedService.ResourceNotFound();
			}

			const units = await authCtx.group
				.related("businessUnits")
				.query()
				.useTransaction(trx)
				.select("id");

			const rowItems = await row
				.related("items")
				.query()
				.useTransaction(trx)
				.whereIn("id", data.receiptItemIds);

			const newProducts = await Product.createMany(
				rowItems.map<Partial<Product>>((elem) => ({
					economic_group_id: authCtx.group.id,
					description: elem.descriptionXml ?? "Não informado",
					type: ProductType.PRODUCT,
					ncm: elem.ncmXml,
					active: true,
					icmsOrigin: "0",
				})),
				{ client: trx },
			);

			const newProductVariations = await ProductVariation.createMany(
				rowItems.map((elem) => ({
					product_id: newProducts.find(
						(p) => p.description === elem.descriptionXml,
					)?.id,
					barcode: elem.barcodeXml,
				})),
				{ client: trx },
			);

			const tasks = rowItems.map((elem) => {
				return elem
					.merge({
						product_variation_id: newProductVariations.find(
							(p) => p.barcode === elem.barcodeXml,
						)?.id,
					})
					.useTransaction(trx)
					.save();
			});
			await Promise.all(tasks);

			const buProductData: Array<Partial<BusinessUnitProduct>> = [];
			for (const unit of units) {
				for (const elem of rowItems) {
					buProductData.push({
						businness_unit_id: unit.id,
						product_variation_id: newProductVariations.find(
							(p) => p.barcode === elem.barcodeXml,
						)?.id,
						stock: 0,
						maximumStock: 0,
						minimumStock: 0,
						maximumDiscountPercentage: 100,
						maximumDiscountValue: 0,
						price: 0,
						costPrice: elem.costValue,
						profitMargin: 0,
						commission: 0,
						meta: 0,
						metaType: undefined,
						commissionMeta: 0,
					});
				}
			}

			await BusinessUnitProduct.createMany(buProductData, { client: trx });

			// fetchOrCreateMany deveria funcionar, mas não funciona 🤔
			// const supplierTasks = rowItems.map(async (elem) => {
			// 	const existingProduct = await SupplierProduct.query()
			// 		.useTransaction(trx)
			// 		.where("economic_group_id", authCtx.group.id)
			// 		.where("supplier_id", row.supplier_id)
			// 		.where("product_variation_id", elem.product_variation_id)
			// 		.where("product_supplier_id", elem.barcodeXml)
			// 		.first();
			//
			// 	if (existingProduct) {
			// 		return existingProduct;
			// 	}
			//
			// 	return SupplierProduct.create(
			// 		{
			// 			economic_group_id: authCtx.group.id,
			// 			supplier_id: row.supplier_id,
			// 			product_variation_id: elem.product_variation_id,
			// 			product_supplier_id: elem.barcodeXml,
			// 		},
			// 		{ client: trx },
			// 	);
			// });
			// await Promise.all(supplierTasks);

			await SupplierProduct.fetchOrCreateMany(
				[
					"economic_group_id",
					"supplier_id",
					"product_variation_id",
					"product_supplier_id",
				],
				rowItems.map((elem) => ({
					economic_group_id: authCtx.group.id,
					supplier_id: row.supplier_id,
					product_variation_id: newProductVariations.find(
						(p) => p.barcode === elem.barcodeXml,
					)?.id,
					product_supplier_id: elem.productSupplierXml,
				})),
				{ client: trx },
			);
		});
	}

	async createSupplierProducts(
		authCtx: AuthContext,
		data: {
			receiptId: string;
			items: {
				supplierId: string;
				productVariationId: string;
				productSupplier: string;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			// const supplierProducts = await SupplierProduct.fetchOrCreateMany(
			// 	["economic_group_id", "supplier_id", "product_variation_id"],
			// 	data.items.map((elem) => ({
			// 		economic_group_id: authCtx.group.id,
			// 		supplier_id: elem.supplierId,
			// 		product_variation_id: elem.productVariationId,
			// 		product_supplier_id: elem.productSupplier,
			// 	})),
			// 	{ client: trx },
			// );
			const supplierTasks = data.items.map(async (elem) => {
				const existingProduct = await SupplierProduct.query()
					.useTransaction(trx)
					.where("economic_group_id", authCtx.group.id)
					.where("supplier_id", elem.supplierId)
					.where("product_variation_id", elem.productVariationId)
					.where("product_supplier_id", elem.productSupplier)
					.first();

				if (existingProduct) {
					return existingProduct;
				}

				return SupplierProduct.create(
					{
						economic_group_id: authCtx.group.id,
						supplier_id: elem.supplierId,
						product_variation_id: elem.productVariationId,
						product_supplier_id: elem.productSupplier,
					},
					{ client: trx },
				);
			});
			const supplierProducts = await Promise.all(supplierTasks);

			const receiptItems = await ReceiptItem.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("receipt_id", data.receiptId)
				.whereNull("product_variation_id");

			const tasks = receiptItems.map((elem) => {
				return elem
					.merge({
						product_variation_id: supplierProducts.find(
							(p) => p.product_supplier_id === elem.productSupplierXml,
						)?.product_variation_id,
					})
					.useTransaction(trx)
					.save();
			});
			await Promise.all(tasks);
		});
	}

	async excludeReceipt(
		authCtx: AuthContext,
		data: {
			receiptId: string;
		},
	) {
		if (!authCtx.hasPermission("ENT09")) {
			throw new UnauthorizedException("Usuário sem permissão", 401, "E_ERR");
		}

		await Database.transaction(async (trx) => {
			const receipt = await Receipt.query()
				.useTransaction(trx)
				.preload("payments")
				.where("id", data.receiptId)
				.where("business_unit_id", authCtx.unit.id)
				.firstOrFail();

			if (receipt.status === "Baixada") {
				throw new BadRequestException(
					"Notas baixada não podem ser excluídas",
					400,
					"E_ERR",
				);
			}

			const invalidFinances = await Finance.query()
				.useTransaction(trx)
				.whereIn(
					"origin_id",
					receipt.payments.map((r) => r.id),
				)
				.whereNull("exclusion_user_id");
			if (invalidFinances.some((p) => p.status !== FinanceStatus.A)) {
				throw new BadRequestException(
					"Registros financeiros precisam estar abertos",
					400,
					"E_ERR",
				);
			}

			await receipt
				.merge({
					deleted_user_id: authCtx.user.id,
					status: "Excluida",
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();

			await ReceiptItem.query()
				.useTransaction(trx)
				.where("receipt_id", receipt.id)
				.whereNot("status", "Excluido")
				.update({
					disabled_user_id: authCtx.user.id,
					status: "Excluido",
					disabledDate: DateTime.now(),
				});

			await Finance.query()
				.useTransaction(trx)
				.whereRaw(
					`origin_id in (select id from receipt_payments where receipt_id = ? and status <> 'Excluido')`,
					[receipt.id],
				)
				.whereNull("exclusion_user_id")
				.update({
					exclusion_user_id: authCtx.user.id,
					expirationDate: DateTime.now(),
				});

			await ReceiptPayment.query()
				.useTransaction(trx)
				.where("receipt_id", receipt.id)
				.whereNot("status", "Excluido")
				.update({
					deleted_user_id: authCtx.user.id,
					status: "Excluido",
					deletedAt: DateTime.now(),
				});

			await IssuedFiscalDocument.query()
				.useTransaction(trx)
				.where("bill_id", receipt.id)
				.whereNull("deleted_at")
				.update({
					deleted_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				});
		});
	}

	private async createFinanceEntry(
		trx: TransactionClientContract,
		authCtx: AuthContext,
		data: {
			dailyMovementId?: string;
			dailyCashierId?: string;
			tefFlagId?: string;
			tefAcquirerId?: string;
			supplierId: string;
			paymentMethodId: string;
			accountPlanId?: string;

			tag: string;
			item: ReceiptPayment;
		},
	) {
		const supplier = await Patient.query()
			.useTransaction(trx)
			.where("id", data.supplierId)
			.preload("tutor")
			.first();

		if (!supplier) {
			throw new BadRequestException(
				"Fornecedor não encontrado",
				400,
				"E_NOT_FOUND",
			);
		}

		const $checkingAccountMeta =
			await BusinessUnitCheckingAccountPaymentMethod.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("payment_method_id", data.paymentMethodId)
				.first();

		return await Finance.create(
			{
				economic_group_id: authCtx.group.id,
				business_unit_id: authCtx.unit.id,

				user_id: authCtx.user.id,
				client_id: data.supplierId,
				daily_cashier_id: data.dailyCashierId,
				daily_movement_id: data.dailyMovementId,
				account_plan_id:
					data.accountPlanId ??
					supplier?.tutor?.account_plan_id ??
					authCtx.unit?.unitConfig?.order_entry_account_plan_id,
				payment_method_id: data.paymentMethodId,
				tef_flag_id: data.tefFlagId,
				acquirer_id: data.tefAcquirerId,
				origin_id: data.item.id,
				checking_account_id: $checkingAccountMeta?.checking_account_id,

				type: FinanceType.D,
				block: data.item.block,
				installment: data.item.installment,
				qtyInstallments: data.item.blockInstallments,
				originFlag: FinanceOriginFlag.E,
				document: `NFE-${data.tag}`,
				historic: `NFE-${data.tag}`,
				issueDate: DateTime.now(),
				expirationDate: data.item.expirationDate,
				originalValue: data.item.installmentValue,
				value: data.item.installmentValue,
				totalValue: data.item.installmentValue,
				feeValue: 0,
				feePercentage: 0,
				accept: FinanceAccept.N,
				reconciled: false,
				competenceDate: DateTime.now().toFormat("MM/yyyy"),
				nsuDocument: data.item.nsuDocument,
				status: FinanceStatus.A,
			},
			{
				client: trx,
			},
		);
	}

	private async syncReceipt(trx: TransactionClientContract, receipt: Receipt) {
		const items = await ReceiptItem.query()
			.useTransaction(trx)
			.where("economic_group_id", receipt.economic_group_id)
			.where("business_unit_id", receipt.business_unit_id)
			.where("receipt_id", receipt.id)
			.where("status", "Ativo");

		await receipt
			.merge({
				productValue: this.sharedService.sum(
					items.map((elem) => elem.totalValue),
				),
				serviceValue: 0,
				discountValue: this.sharedService.sum(
					items.map((elem) => elem.discountValue),
				),
				totalValue: this.sharedService.sum(
					items.map((elem) => elem.totalValue),
				),
				deliveryValue: 0,

				// icmsBase: this.sharedService.sum(items.map((elem) => elem.icmsBase)),
				// icmsValue: this.sharedService.sum(items.map((elem) => elem.icmsValue)),
				// icmsStBase: this.sharedService.sum(
				// 	items.map((elem) => elem.icmsStBase),
				// ),
				// icmsStValue: this.sharedService.sum(
				// 	items.map((elem) => elem.icmsStValue),
				// ),
				// icmsDeferredValue: this.sharedService.sum(
				// 	items.map((elem) => elem.icmsDeferredValue),
				// ),
				// icmsFcpValue: this.sharedService.sum(
				// 	items.map((elem) => elem.icmsFcpValue),
				// ),
				// icmsUfOriginValue: this.sharedService.sum(
				// 	items.map((elem) => elem.icmsPartitionOriginUfValue),
				// ),
				// icmsUfDestinationValue: this.sharedService.sum(
				// 	items.map((elem) => elem.icmsPartitionDestinationUfValue),
				// ),
				//
				// issValue: this.sharedService.sum(items.map((elem) => elem.issValue)),
				//
				// pisBase: this.sharedService.sum(items.map((elem) => elem.pisBase)),
				// pisValue: this.sharedService.sum(items.map((elem) => elem.pisValue)),
				// pisRetentionValue: this.sharedService.sum(
				// 	items.map((elem) => elem.pisRetentionValue),
				// ),
				//
				// cofinsBase: this.sharedService.sum(
				// 	items.map((elem) => elem.cofinsBase),
				// ),
				// cofinsValue: this.sharedService.sum(
				// 	items.map((elem) => elem.cofinsValue),
				// ),
				// cofinsRetentionValue: this.sharedService.sum(
				// 	items.map((elem) => elem.cofinsRetentionValue),
				// ),
				//
				// ipiBase: this.sharedService.sum(items.map((elem) => elem.ipiBase)),
				// ipiValue: this.sharedService.sum(items.map((elem) => elem.ipiValue)),
			})
			.useTransaction(trx)
			.save();
	}
}
