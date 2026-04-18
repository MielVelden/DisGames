import GameService from "../../services/domain/GameService";
import MetricService from "../../services/domain/MetricService";
import UserService from "../../services/domain/UserService";

export async function initAsync(): Promise<void> {
    await GameService.initAsync();
    await UserService.initAsync();
    await MetricService.initAsync();
}