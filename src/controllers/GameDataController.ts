import { Controller } from "../interfaces/application/Controller";
import { GameDataModel, GameDataSaveModel } from "../interfaces/database/TableInterfaces";
import { User } from "../interfaces/domain";
import GameDataService from "../services/domain/GameDataService";
import { GameTypeEnum } from "../interfaces/enums";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { GameDataSaveRequest, GameDataResponse } from "../interfaces/view/GameData";
import { TimelineEvent } from "../interfaces/application";

function normalizeLanguageKeys(obj: Record<number, string> | undefined): Record<string, string> {
    if (!obj) 
        return {};
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [String(k), v]));
}

function toGameDataViewModel(model: GameDataModel): GameDataResponse {
    const messageJson = model.Message?.toJSON?.() ?? (typeof model.Message === "object" && model.Message !== null ? (model.Message as unknown) as Record<number, string> : undefined);
    const responseJson = model.Response?.toJSON?.() ?? (typeof model.Response === "object" && model.Response !== null ? (model.Response as unknown) as Record<number, string> : undefined);
    
    return {
        Id: model.Id,
        DataSheetId: model.DataSheetId,
        GameId: model.GameId,
        Message: normalizeLanguageKeys(messageJson),
        Response: normalizeLanguageKeys(responseJson),
    };
}

function toSaveModel(body: GameDataSaveRequest): GameDataSaveModel {
    const message = body.Message != null ? MultiLingualString.fromJSON(body.Message as Record<number, string>) : undefined;
    const response = body.Response != null ? MultiLingualString.fromJSON(body.Response as Record<number, string>) : undefined;
    
    return new GameDataSaveModel({
        Id: body.Id,
        DataSheetId: body.DataSheetId,
        GameId: body.GameId as GameTypeEnum | undefined,
        Message: message ?? undefined,
        Response: response ?? undefined,
    });
}

class GameDataController implements Controller {
    async getByIdAsync(id: string | number, identity: User): Promise<GameDataResponse> {
        const numId = typeof id === "string" ? parseInt(id, 10) : id;
        const model = await GameDataService.getByIdAsync(numId);
        return toGameDataViewModel(model);
    }

    async getAllAsync(identity: User): Promise<GameDataResponse[]> {
        const list = await GameDataService.getAllAsync();
        return list.map(toGameDataViewModel);
    }

    async getByDataSheetIdAsync(dataSheetId: string | number, identity: User): Promise<GameDataResponse[]> {
        const numId = typeof dataSheetId === "string" ? parseInt(dataSheetId, 10) : dataSheetId;
        const list = await GameDataService.getByDataSheetIdAsync(numId);
        return list.map(toGameDataViewModel);
    }

    async getByGameIdAsync(gameId: string | number, identity: User): Promise<GameDataResponse[]> {
        const numId = typeof gameId === "string" ? parseInt(gameId, 10) : gameId;
        const list = await GameDataService.getByGameIdAsync(numId as GameTypeEnum);
        return list.map(toGameDataViewModel);
    }

    async saveAsync(body: GameDataSaveRequest, timelineEvent: TimelineEvent, identity: User): Promise<GameDataResponse> {
        const saveModel = toSaveModel(body);
        const saved = await GameDataService.saveAsync(saveModel, timelineEvent);
        return toGameDataViewModel(saved);
    }
}

export default GameDataController;
