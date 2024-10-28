import { ApplicationContract } from "@ioc:Adonis/Core/Application";
import Tracer from "App/Lib/Tracer";

export default class AppProvider {
	constructor(protected app: ApplicationContract) {}

	public register() {
		// Register your own bindings
	}

	public async boot() {
		// IoC container is ready
		Tracer.init();
	}

	public async ready() {
		// App is ready
	}

	public async shutdown() {
		// Cleanup, since app is going down
	}
}
