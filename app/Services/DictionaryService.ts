import { inject } from "@adonisjs/fold";
import Dictionary from "App/Models/Dictionary";

type TDictionary = {
	[K: string]: {
		[key: string]: {
			[C: string]: string;
		};
	};
};

@inject()
export default class DictionaryService {
	public async index() {
		const words = await Dictionary.all();

		const dictionary: TDictionary = {};

		for (const { lang, key, client, word } of words) {
			if (!dictionary[lang]) {
				dictionary[lang] = {};
			}

			if (!dictionary[lang][key]) {
				dictionary[lang][key] = {};
			}

			dictionary[lang][key][client] = word;
		}

		return dictionary;
	}
}
