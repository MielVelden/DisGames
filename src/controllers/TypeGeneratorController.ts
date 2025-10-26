import { generateDisGamesTypes } from "../utils/api/GenerateApiTypes";

export class TypeGeneratorController {
	async generateApiTypes(): Promise<string> {
		return await generateDisGamesTypes();
	}
}
