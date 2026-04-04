import GameService from "../../services/domain/GameService";
import UserService from "../../services/domain/UserService";

export async function initAsync(): Promise<void> {
    await GameService.initAsync();
    await UserService.initAsync();
}