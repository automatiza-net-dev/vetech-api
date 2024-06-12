import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import ProductDocument, {
	type TProductDocumentType,
} from "App/Models/ProductDocument";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";

@inject()
export default class ProductDocumentService {
	constructor(private shared: SharedService) {}

	public async index(
		authCtx: AuthContext,
		data: { systemProduct?: string; product?: string },
	) {
		if (!data.systemProduct) {
			throw new BadRequestException(
				"É preciso informat o Produto",
				400,
				"E_ERR",
			);
		}

		const qb = ProductDocument.query()
			.where("system_id", authCtx.system.id)
			.where("system_product_id", data.systemProduct)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.whereRaw("(business_unit_id = ? or business_unit_id is null)", [
				authCtx.unit.id,
			]);

		if (data.product) {
			qb.where("product_id", data.product);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			system_id: elem.system_id,
			system_product_id: elem.system_product_id,
			economic_group_id: elem.economic_group_id,
			business_unit_id: elem.business_unit_id,
			product_id: elem.product_id,
			document_template_id: elem.document_template_id,
			type: elem.type,
			active: elem.active,
			origin: elem.origin,
		}));
	}

	public async store(
		authCtx: AuthContext,
		data: {
			systemProductId: number;
			economicGroupId: string;
			businessUnitId: string;
			productId?: string;
			documentTemplateId: string;
			type: TProductDocumentType;
		},
	) {
		return ProductDocument.create({
			system_id: authCtx.system.id,
			system_product_id: data.systemProductId,
			economic_group_id: data.economicGroupId,
			business_unit_id: data.businessUnitId,
			product_id: data.productId,
			document_template_id: data.documentTemplateId,
			type: data.type,
			active: true,
		});
	}

	public async destroy(authCtx: AuthContext, id: string) {
		const elem = await ProductDocument.query()
			.where("system_id", authCtx.system.id)
			.where("id", id)
			.first();

		if (
			!elem ||
			(elem.economic_group_id && elem.economic_group_id !== authCtx.group.id) ||
			(elem.business_unit_id && elem.business_unit_id !== authCtx.unit.id)
		) {
			throw this.shared.ResourceNotFound();
		}

		await elem
			.merge({ exclusion_user_id: authCtx.user.id, deletedAt: DateTime.now() })
			.save();
	}
}
