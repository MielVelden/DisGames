import { Component } from "../../interfaces/application/Message";
import { ProfileCardData } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import ProfileCard from "../images/ProfileCard";

export async function createProfileContainerAsync(profile: ProfileCardData): Promise<Component[]> {
    const media = await ProfileCard.generateAsync(profile);
    return [
        ComponentService.createImage(media, false),
        ComponentService.createSeparator(),
    ];
}
