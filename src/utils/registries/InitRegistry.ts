import GameService from "../../services/domain/GameService";
import MediaService from "../../services/application/MediaService";
import MetricService from "../../services/domain/MetricService";
import UserService from "../../services/domain/UserService";

export async function initAsync(): Promise<void> {
    await MediaService.initAsync();
    await GameService.initAsync();
    await UserService.initAsync();
    await MetricService.initAsync();
}