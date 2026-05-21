import { Component } from "../../interfaces/application/Message";
import { ProfileResponse } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import MediaService from "../../services/application/MediaService";
import { createBlock, createTitle } from "../../utils/helpers/Markdown";
import { createMultiLingualString, MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import ProgressBarService from "../images/BarCard";
import ProfileCard from "../images/ProfileCard";

export async function createProfileContainerAsync(profile: ProfileResponse): Promise<Component[]> {
    const profileContainerImage = MediaService.getBaseImage('profile');

    const media = await ProgressBarService.generate(76, {
        textAbove: "Level 3 -> Level 4",
    });

    const media2 = await ProfileCard.generate({
        // Left panel
        title: 'Your Progress',
        stats: [
            { icon: '🛡️', label: 'Rank', value: 'Gold III' },
            { icon: '⭐', label: 'Points', value: '12,580' },
            { icon: '🔥', label: 'Streak', value: '15 Days' },
        ],
        // Right panel
        achievementsTitle: 'Shared Files',
        achievements: [
            { icon: 'D', iconColor: '#3B82F6', title: 'Design Spec v2.pdf', description: 'Updated gameplay flow and UI wireframes for the next release.', date: 'Jan 12, 2024' },
            { icon: 'Q', iconColor: '#10B981', title: 'Q1 Roadmap.xlsx', description: 'Milestones, owners, and delivery dates for Q1 features.', date: 'Feb 08, 2024' },
            { icon: 'R', iconColor: '#F59E0B', title: 'Release Notes Draft.docx', description: 'Initial draft of patch highlights, fixes, and known issues.', date: 'Mar 21, 2024' },
        ],
        accentColor: '#8B5CF6',
        sphereColor: '#8B5CF6',
    });

    return [
        ComponentService.createImage(profileContainerImage, false),
        ComponentService.createSeparator(),
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.profile.labels.title), "👤")),
        ComponentService.createContent(new MultiLingualString(i18n.commands.profile.description)),
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.profile.labels.username))),
        ComponentService.createContent(createMultiLingualString(createBlock(profile.Username))),
        ComponentService.createContent(createBlock(i18n.commands.profile.labels.joinedAt(profile.JoinedAt))),
        ComponentService.createImage(media, false),
        ComponentService.createImage(media2, false),
        ComponentService.createSeparator(),
    ];
}
