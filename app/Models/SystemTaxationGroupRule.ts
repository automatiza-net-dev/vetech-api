import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";
import { DateTime } from "luxon";

import {
	CompanyType,
	COMPLETE_ICMS,
	IPI_CST,
	MovementCategory,
	MovementType,
	PIS_CST__COFINS_CST,
} from "./TaxationGroupRule";

export default class SystemTaxationGroupRule extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({
		columnName: "company_type",
	})
	public companyType: CompanyType;

	@column({
		columnName: "movement_type",
	})
	public movementType: MovementType;

	@column({
		columnName: "movement_category",
	})
	public movementCategory: MovementCategory;

	@column({
		columnName: "tax_operation_code",
	})
	public taxOperationCode: string;

	@column({
		columnName: "from_uf",
	})
	public fromUf: string;

	@column({
		columnName: "to_uf",
	})
	public toUf: string;

	// @column({
	//   columnName: 'cod_operacao_fiscal',
	// })
	// public codOperacaoFiscal: string;

	@column({
		columnName: "icms_cst",
	})
	public icmsCst: (typeof COMPLETE_ICMS)[number];

	@column({
		columnName: "icms_perc",
		serialize: parseFloat,
	})
	public icmsPerc: number;

	@column({
		columnName: "icms_perc_red_aliquota",
		serialize: parseFloat,
	})
	public icmsPercRedAliquota: number;

	@column({
		columnName: "icms_perc_red_base_calculo",
		serialize: parseFloat,
	})
	public icmsPercRedBaseCalculo: number;

	@column({
		columnName: "iva_icms_st",
		serialize: parseFloat,
	})
	public ivaIcmsSt: number;

	@column({
		columnName: "fcp_perc",
		serialize: parseFloat,
	})
	public fcpPerc: number;

	@column({
		columnName: "tax_benefit_code",
	})
	public taxBenefitCode: string;

	@column({
		columnName: "ipi_cst",
	})
	public ipiCst: (typeof IPI_CST)[number];

	@column({
		columnName: "ipi_perc",
		serialize: parseFloat,
	})
	public ipiPerc: number;

	@column({
		columnName: "pis_cst",
	})
	public pisCst: (typeof PIS_CST__COFINS_CST)[number];

	@column({
		columnName: "pis_perc",
		serialize: parseFloat,
	})
	public pisPerc: number;

	@column({
		columnName: "cofins_cst",
	})
	public cofinsCst: (typeof PIS_CST__COFINS_CST)[number];

	@column({
		columnName: "cofins_perc",
		serialize: parseFloat,
	})
	public cofinsPerc: number;

	@column({
		columnName: "icms_perc_red_base_calculo_st",
		serialize: parseFloat,
	})
	public icmsPercRedBaseCalculoST: number;

	@column({
		columnName: "icms_perc_diferimento",
		serialize: parseFloat,
	})
	public icmsPercDiferimento: number;

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public system_id: number;

	@column({
		serializeAs: null,
	})
	public system_taxation_group_id: number;
}
