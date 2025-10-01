import { generateDisGamesTypes } from "../utils/frontendapi/GenerateDisGamesTypes";

export class TypeGeneratorController {
	async generateApiTypes(): Promise<string> {
		return await generateDisGamesTypes();
	}
}
