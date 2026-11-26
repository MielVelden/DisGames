import { Component } from "../../interfaces/application/Message";
import { ProfileCardData } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import ProfileCard from "../cards/ProfileCard";
import { CardTheme } from "../../interfaces/domain/StylePreset";

export async function createProfileContainerAsync(profile: ProfileCardData, cardTheme?: CardTheme): Promise<Component[]> {
    const media = await ProfileCard.generateAsync(profile, undefined, cardTheme);
    return [
        ComponentService.createImage(media, false),
        ComponentService.createSeparator(),
    ];
}
