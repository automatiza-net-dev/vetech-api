import { inject } from "@adonisjs/fold";
import TaxationGroupRule, {
	CompanyType,
	MovementType,
} from "App/Models/TaxationGroupRule";
import User from "App/Models/User";
import SharedService from "App/Services/SharedService";
import ITaxationGroupRuleData from "Contracts/interfaces/ITaxationGroupRuleData";

interface ISearch {
	name?: string;
	type?: CompanyType;
	movement?: MovementType;
	fromUf?: string;
	toUf?: string;
	active?: string;
}
@inject()
export default class TaxationGroupRuleService {
	constructor(private sharedService: SharedService) {}

	public async index(unitId: string, data: ISearch) {
		const group = await this.sharedService.getUserGroup(unitId);

		const query = TaxationGroupRule.query()
			.preload("taxationGroup")
			.preload("taxOperation")
			.whereIn("taxation_group_id", (query) => {
				query
					.select("id")
					.from("taxation_groups")
					.where("economic_group_id", group.id);
			});

		if (data.name) {
			query.whereHas("taxationGroup", (query) => {
				query.where("name", "like", `%${data.name}%`);
			});
		}

		if (data.type) {
			query.where("company_type", data.type);
		}

		if (data.movement) {
			query.where("movement_type", data.movement);
		}

		if (data.fromUf) {
			query.where("from_uf", data.fromUf);
		}

		if (data.toUf) {
			query.where("to_uf", data.toUf);
		}

		if (data.active) {
			query.where("active", data.active === "true");
		}

		const result = await query;

		return result.sort((a, b) => {
			return (
				a.taxationGroup.name.localeCompare(b.taxationGroup.name) ||
				a.companyType.localeCompare(b.companyType)
			);
		});
	}

	public async store(data: Omit<ITaxationGroupRuleData, "active">) {
		const rule = await TaxationGroupRule.create({
			companyType: data.companyType,
			movementType: data.movementType,
			movementCategory: data.movementCategory,
			fromUf: data.fromUf,
			toUf: data.toUf,
			icmsCst: data.icmsCst,
			icmsPerc: data.icmsPerc,
			icmsPercRedAliquota: data.icmsPercRedAliquota,
			icmsPercRedBaseCalculo: data.icmsPercRedBaseCalculo,
			ivaIcmsSt: data.ivaIcmsSt,
			fcpPerc: data.fcpPerc,
			taxBenefitCode: data.taxBenefitCode,
			ipiCst: data.ipiCst,
			ipiPerc: data.ipiPerc,
			pisCst: data.pisCst,
			cofinsCst: data.cofinsCst,
			active: true,
			icmsPercDiferimento: data.icmsPercDiferimento,
			icmsPercRedBaseCalculoST: data.icmsPercRedBaseCalculoST,
			pisPerc: data.pisPerc,
			cofinsPerc: data.cofinsPerc,
			tax_operation_id: data.taxOperationId,
			taxation_group_id: data.taxationGroupId,
		});

		return rule;
	}

	public async show(unitId: string, user: User, id: string) {
		const group = await this.sharedService.getUserGroup(unitId);
		const isSudo = await this.sharedService.isSuperAdmin(user);

		const rule = await TaxationGroupRule.query()
			.preload("taxationGroup")
			.preload("taxOperation")
			.where("id", id)
			.first();

		if (!rule) {
			throw this.sharedService.ResourceNotFound();
		}

		if (!isSudo) {
			if (
				rule.taxationGroup.economic_group_id &&
				rule.taxationGroup.economic_group_id !== group.id
			) {
				throw this.sharedService.ResourceNotFound();
			}
		}

		return rule;
	}

	public async update(
		unitId: string,
		user: User,
		id: string,
		data: ITaxationGroupRuleData,
	) {
		const rule = await this.show(unitId, user, id);

		rule.merge({
			companyType: data.companyType,
			movementType: data.movementType,
			movementCategory: data.movementCategory,
			fromUf: data.fromUf,
			toUf: data.toUf,
			icmsCst: data.icmsCst,
			icmsPerc: data.icmsPerc,
			icmsPercRedAliquota: data.icmsPercRedAliquota,
			icmsPercRedBaseCalculo: data.icmsPercRedBaseCalculo,
			ivaIcmsSt: data.ivaIcmsSt,
			fcpPerc: data.fcpPerc,
			taxBenefitCode: data.taxBenefitCode,
			ipiCst: data.ipiCst,
			ipiPerc: data.ipiPerc,
			pisCst: data.pisCst,
			cofinsCst: data.cofinsCst,
			active: data.active,
			icmsPercDiferimento: data.icmsPercDiferimento,
			icmsPercRedBaseCalculoST: data.icmsPercRedBaseCalculoST,
			pisPerc: data.pisPerc,
			cofinsPerc: data.cofinsPerc,
			tax_operation_id: data.taxOperationId,
			taxation_group_id: data.taxationGroupId,
		});

		return rule.save();
	}

	public async destroy(unitId: string, user: User, id: string) {
		const rule = await this.show(unitId, user, id);

		await rule.softDelete();
	}
}
