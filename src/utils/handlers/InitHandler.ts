import GameService from "../../services/domain/GameService";

export async function initAsync(): Promise<void> {
    await GameService.initAsync();
}