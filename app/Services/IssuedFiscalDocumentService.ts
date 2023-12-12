import { inject } from "@adonisjs/fold";
import BusinessUnitFiscalDocument from "App/Models/BusinessUnitFiscalDocument";
import { FiscalDocumentType } from "App/Models/FiscalDocument";
import IssuedFiscalDocument from "../Models/IssuedFiscalDocument";
import { AuthContext } from "./SharedService";

interface ISearch {
	unit: string;
	type: FiscalDocumentType;
	description: string;
	model: string;
	series: string;
	sequence: number;
}

@inject()
export default class IssuedFiscalDocumentService {
	public async index(_: string, data: ISearch) {
		const qb = BusinessUnitFiscalDocument.query();

		if (data.unit) {
			qb.where("business_unit_id", data.unit);
		}

		if (data.type) {
			qb.where("movement_type", data.type);
		}

		if (data.description) {
			qb.whereILike("description", data.description);
		}

		if (data.model) {
			qb.whereILike("model", data.model);
		}

		if (data.series) {
			qb.whereILike("series", data.series);
		}

		if (data.sequence) {
			qb.where("sequence", data.sequence);
		}

		return qb;
	}

	public async search(authCtx: AuthContext, data: { bill?: string }) {
		const qb = IssuedFiscalDocument.query()
			.preload("authorizationUser", (query) => {
				query.select(["id", "name"]);
			})
			.preload("cancellationUser", (query) => {
				query.select(["id", "name"]);
			})
			.preload("disablingUser", (query) => {
				query.select(["id", "name"]);
			})
			.preload("corrections", (query) => {
				query.preload("user", (query) => {
					query.select(["id", "name"]);
				});
			})
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id);

		if (data.bill) {
			qb.where("bill_id", data.bill);
		}

		return qb;
	}
}
