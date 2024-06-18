/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/

import { validator } from "@ioc:Adonis/Core/Validator";
import { validate } from "App/Shared";

function isValidEmail(email: string) {
	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return regex.test(email);
}

const validDDDs = [
	"11", // São Paulo - SP
	"12", // São José dos Campos - SP
	"13", // Santos - SP
	"14", // Bauru - SP
	"15", // Sorocaba - SP
	"16", // Ribeirão Preto - SP
	"17", // São José do Rio Preto - SP
	"18", // Presidente Prudente - SP
	"19", // Campinas - SP
	"21", // Rio de Janeiro - RJ
	"22", // Campos dos Goytacazes - RJ
	"24", // Volta Redonda - RJ
	"27", // Vitória - ES
	"28", // Cachoeiro de Itapemirim - ES
	"31", // Belo Horizonte - MG
	"32", // Juiz de Fora - MG
	"33", // Governador Valadares - MG
	"34", // Uberlândia - MG
	"35", // Poços de Caldas - MG
	"37", // Divinópolis - MG
	"38", // Montes Claros - MG
	"41", // Curitiba - PR
	"42", // Ponta Grossa - PR
	"43", // Londrina - PR
	"44", // Maringá - PR
	"45", // Foz do Iguaçu - PR
	"46", // Francisco Beltrão - PR
	"47", // Joinville - SC
	"48", // Florianópolis - SC
	"49", // Chapecó - SC
	"51", // Porto Alegre - RS
	"53", // Pelotas - RS
	"54", // Caxias do Sul - RS
	"55", // Santa Maria - RS
	"61", // Brasília - DF
	"62", // Goiânia - GO
	"63", // Palmas - TO
	"64", // Rio Verde - GO
	"65", // Cuiabá - MT
	"66", // Rondonópolis - MT
	"67", // Campo Grande - MS
	"68", // Rio Branco - AC
	"69", // Porto Velho - RO
	"71", // Salvador - BA
	"73", // Ilhéus - BA
	"74", // Juazeiro - BA
	"75", // Feira de Santana - BA
	"77", // Barreiras - BA
	"79", // Aracaju - SE
	"81", // Recife - PE
	"82", // Maceió - AL
	"83", // João Pessoa - PB
	"84", // Natal - RN
	"85", // Fortaleza - CE
	"86", // Teresina - PI
	"87", // Petrolina - PE
	"88", // Juazeiro do Norte - CE
	"89", // Picos - PI
	"91", // Belém - PA
	"92", // Manaus - AM
	"93", // Santarém - PA
	"94", // Marabá - PA
	"95", // Boa Vista - RR
	"96", // Macapá - AP
	"97", // Coari - AM
	"98", // São Luís - MA
	"99", // Imperatriz - MA
];

function validatePhone(phoneNumber: string | undefined): boolean {
	if (!phoneNumber) {
		return false;
	}

	const removeSymbols = phoneNumber.replace(/[^0-9]/g, "");

	if (!validDDDs.includes(removeSymbols.substring(0, 2))) {
		return false;
	}

	const requiredLength = 11;
	const isValidLength = removeSymbols.length === requiredLength;

	return isValidLength;
}

validator.rule("documento", (value, _, options) => {
	if (typeof value !== "string") {
		return;
	}

	if (!validate(value)) {
		options.errorReporter.report(
			options.pointer,
			"documento",
			"Documento inválido",
			options.arrayExpressionPointer,
		);
	}
});

validator.rule("emailContato", (value, _, options) => {
	// console.log(value, options.tip);

	// if (options.tip.notGiven) {
	// 	options.errorReporter.report(
	// 		options.pointer,
	// 		"required",
	// 		"Campo obrigatório",
	// 		options.arrayExpressionPointer,
	// 	);
	// }

	if (
		!options.tip.notGiven &&
		options.tip.type === "email" &&
		!isValidEmail(value)
	) {
		options.errorReporter.report(
			options.pointer,
			"emailContato",
			"Email inválido",
			options.arrayExpressionPointer,
		);
		return;
	}

	if (
		!options.tip.notGiven &&
		options.tip.type !== "email" &&
		!validatePhone(value)
	) {
		options.errorReporter.report(
			options.pointer,
			"telefoneContato",
			"Valor inválido",
			options.arrayExpressionPointer,
		);
	}
});

declare module "@ioc:Adonis/Core/Validator" {
	interface Rules {
		documento(): Rule;
		emailContato(): Rule;
	}
}
