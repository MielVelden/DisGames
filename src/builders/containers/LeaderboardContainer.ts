import { Component } from "../../interfaces/application/Message";
import { LanguageEnum } from "../../interfaces/enums";
import { LeaderboardServerEntry } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import LeaderboardCard from "../images/LeaderboardCard";

export async function createLeaderboardContainerAsync(entries: LeaderboardServerEntry[], language?: LanguageEnum): Promise<Component[]> {
    const media = await LeaderboardCard.generateAsync(entries, language);
    return [
        ComponentService.createImage(media, false),
        ComponentService.createSeparator(),
    ];
}
