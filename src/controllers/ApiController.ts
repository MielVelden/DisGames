import ServerService from "../services/ServerService";
import UserRepository from "../repositories/UserRepository";
import DataSheetRepository from "../repositories/DataSheetRepository";
import GameRepository from "../repositories/GameRepository";
import type { DatasheetsModel, DatasheetsSaveModel, GamesModel, GamesSaveModel, ServersModel, ServersSaveModel, TimelineEntriesModel, UsersModel } from "../interfaces/database";
import TimelineRepository from "../repositories/TimelineRepository";
import ServerRepository from "../repositories/ServerRepository";

export class ApiController {
	private async getAuthorizedIdentity(req: any): Promise<UsersModel | null> {
		const Logger = require("../utils/Logger").default;
		const access = req.res?.locals?.oauth?.access as string | undefined;
		const userId = req.res?.locals?.oauth?.discordUserId as string | undefined;
		Logger.logInfo(`Authorize check for userId=${userId}`);
		if (!userId) return null;
		const user = await UserRepository.getByUserIdAsync(userId);
		if (!user) return null;
		if (!user.OAuth2AccessToken) return user; // allow first-time link
		if (access && user.OAuth2AccessToken === access) return user;
		return null;
	}

	async getServers(): Promise<ServersModel[]> {
		return await ServerRepository.getAllAsync();
	}

	async getUsers() { return await UserRepository.getAllAsync(); }

	async getUserById(userId: string) { return await UserRepository.getByUserIdAsync(userId); }

	async getGames(): Promise<GamesModel[]> {
		return await GameRepository.getAllAsync();
	}

	async getDataSheets(): Promise<DatasheetsModel[]> {
		return await DataSheetRepository.getAllAsync();
	}

	async getTimeline(): Promise<TimelineEntriesModel[]> {
		return await TimelineRepository.getAllAsync();
	}

	async createDataSheet(data: DatasheetsSaveModel): Promise<DatasheetsModel> {
		return await DataSheetRepository.saveAsync(data);
	}
	
	async updateGame(gameId: number, data: GamesSaveModel): Promise<GamesModel> {
		data.Id = gameId;
		return await GameRepository.saveAsync(data);
	}

	async updateServer(serverId: string, data: ServersSaveModel): Promise<ServersModel> {
		const server = await ServerService.getServerAsync(serverId, true);
		return await ServerRepository.saveAsync({ ...server, ...data });
	}
}
