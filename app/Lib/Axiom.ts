import { Axiom } from "@axiomhq/js";
import Env from "@ioc:Adonis/Core/Env";

export const axiom = new Axiom({
	token: Env.get("AXIOM_TOKEN"),
});
