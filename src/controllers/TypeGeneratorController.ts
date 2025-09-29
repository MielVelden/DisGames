import { TypeScriptGenerator } from "../utils/TypeScriptGenerator";

export class TypeGeneratorController {
	async generateApiTypes(): Promise<string> {
		return await TypeScriptGenerator.generateApiTypes();
	}
}
