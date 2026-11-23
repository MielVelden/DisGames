import { Component } from "../../interfaces/application/Message";
import { ProfileCardData } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import ProfileCard from "../cards/ProfileCard";
import { ColorPack } from "../cards/CardTokens";

export async function createProfileContainerAsync(profile: ProfileCardData, palette?: ColorPack): Promise<Component[]> {
    const media = await ProfileCard.generateAsync(profile, undefined, palette);
    return [
        ComponentService.createImage(media, false),
        ComponentService.createSeparator(),
    ];
}
