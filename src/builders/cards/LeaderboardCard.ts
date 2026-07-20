import { createCanvas, CanvasRenderingContext2D, Image } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import packageJson from '../../../package.json';
import { GeneratedMedia } from '../../interfaces/application/Media';
import { BaseCard, TextStyle } from './BaseCard';
import {
    SCALE,
    FONT_SANS,
    FONT_MONO,
    COLOR_PACK,
    COLOR_TEXT,
    COLOR_TEXT_MUTED,
    COLOR_TEXT_FAINT,
    COLOR_PANEL,
    COLOR_PANEL_BORDER,
    COLOR_CHIP_BG,
    COLOR_DIVIDER,
} from './CardTokens';
import { drawCardBackground, drawBrand } from './CardChrome';
import { formatNumber } from '../../utils/helpers/Number';
import { getInitials } from '../../utils/helpers/String';
import { Color } from '../../utils/helpers/Color';
import { LanguageEnum } from '../../interfaces/enums';
import { DEFAULT_LANGUAGE, getMultiLingualString } from '../../utils/i18n/MultiLingualString';
import { i18n } from '../../utils/i18n/i18n';
import { LeaderboardEntry, LeaderboardSubtitleTypeEnum } from '../../interfaces/view';
import { loadLanguageImageAsync, loadMedalImageAsync } from './BadgeAsset';

const CARD_WIDTH = 580 * SCALE;
const CARD_PADDING = 22 * SCALE;
const CONTENT_WIDTH = CARD_WIDTH - CARD_PADDING * 2;

const GOLD: Color = '#FFD23F';
const SILVER: Color = '#CBD5E1';
const BRONZE: Color = '#E0925A';
const RANK_COLORS: Color[] = [GOLD, SILVER, BRONZE];

const HEADER_TOP = CARD_PADDING + 4 * SCALE;
const TITLE_HEIGHT = 26 * SCALE;
const SECTION_LABEL_HEIGHT = 20 * SCALE;
const SECTION_GAP = 12 * SCALE;

const HERO_HEIGHT = 84 * SCALE;
const HERO_AVATAR_SIZE = 56 * SCALE;
const HERO_RADIUS = 10 * SCALE;

const ROW_HEIGHT = 58 * SCALE;
const ROW_AVATAR_SIZE = 38 * SCALE;
const ROWS_RADIUS = 10 * SCALE;

const FOOTER_HEIGHT = 26 * SCALE;

class LeaderboardCardService extends BaseCard {
    constructor() {
        super(path.join('images', 'generated'));
    }

    public async generateAsync(entries: LeaderboardEntry[], language: LanguageEnum = DEFAULT_LANGUAGE): Promise<GeneratedMedia> {
        const uniqueCode = this.generateUniqueCode();
        const filepath = path.join(this.imagesPath, `leaderboard-${uniqueCode}.png`);

        const rows = entries.slice(1);
        const rowsPanelHeight = rows.length > 0 ? rows.length * ROW_HEIGHT : 0;

        const cardHeight =
            HEADER_TOP - CARD_PADDING +
            TITLE_HEIGHT + SECTION_LABEL_HEIGHT + SECTION_GAP * 2 +
            HERO_HEIGHT + SECTION_GAP +
            rowsPanelHeight + (rows.length > 0 ? SECTION_GAP : 0) +
            FOOTER_HEIGHT +
            CARD_PADDING;

        const canvas = createCanvas(CARD_WIDTH, Math.round(cardHeight));
        const ctx = canvas.getContext('2d');

        drawCardBackground(ctx, CARD_WIDTH, canvas.height);
        drawBrand(ctx, CARD_WIDTH);

        let y = HEADER_TOP;
        y = this.drawHeader(ctx, entries.length, CARD_PADDING, y, CONTENT_WIDTH, language);
        y += SECTION_GAP;

        if (entries.length > 0) {
            await this.drawHero(ctx, entries[0], entries[1], CARD_PADDING, y, CONTENT_WIDTH, language);
            y += HERO_HEIGHT + SECTION_GAP;

            if (rows.length > 0) {
                await this.drawRows(ctx, rows, CARD_PADDING, y, CONTENT_WIDTH, rowsPanelHeight, language);
                y += rowsPanelHeight + SECTION_GAP;
            }
        } else {
            this.drawEmptyState(ctx, CARD_PADDING, y, CONTENT_WIDTH, HERO_HEIGHT, language);
            y += HERO_HEIGHT + SECTION_GAP;
        }

        this.drawFooter(ctx, CARD_PADDING, y, CONTENT_WIDTH, language);

        await fs.promises.writeFile(filepath, canvas.toBuffer('image/png'));

        return this.buildMedia(uniqueCode, filepath, {
            name: `leaderboard-${uniqueCode}`,
        });
    }

    private drawHeader(ctx: CanvasRenderingContext2D, count: number, x: number, y: number, width: number, language: LanguageEnum): number {
        const title = getMultiLingualString(i18n.commands.leaderboard.labels.title, language);
        const titleStyle: TextStyle = {
            font: `800 ${20 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            baseline: 'top',
        };
        ctx.font = titleStyle.font;
        this.drawText(ctx, title, x, y, titleStyle);
        const titleWidth = ctx.measureText(title).width;

        const chipText = i18n.commands.leaderboard.labels.entriesCount(formatNumber(count)).getMessage(language);
        const chipFont = `600 ${10.5 * SCALE}px ${FONT_MONO}`;
        ctx.font = chipFont;
        const chipTextWidth = ctx.measureText(chipText).width;
        const chipPadX = 8 * SCALE;
        const chipHeight = 20 * SCALE;
        const chipWidth = chipTextWidth + chipPadX * 2;
        const chipX = x + titleWidth + 10 * SCALE;
        const chipY = y + (TITLE_HEIGHT - chipHeight) / 2;
        this.fillRoundedRect(ctx, chipX, chipY, chipWidth, chipHeight, 6 * SCALE, COLOR_CHIP_BG);
        this.drawText(ctx, chipText, chipX + chipWidth / 2, chipY + chipHeight / 2 + 0.5 * SCALE, {
            font: chipFont,
            color: COLOR_TEXT_MUTED,
            align: 'center',
            baseline: 'middle',
        });

        const labelY = y + TITLE_HEIGHT + 6 * SCALE;
        this.fillCircle(ctx, x + 3 * SCALE, labelY + SECTION_LABEL_HEIGHT / 2 - 1 * SCALE, 2.5 * SCALE, COLOR_PACK.accent);
        this.drawText(ctx, getMultiLingualString(i18n.commands.leaderboard.labels.allTimePoints, language), x + 12 * SCALE, labelY + SECTION_LABEL_HEIGHT / 2, {
            font: `700 ${10 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_FAINT,
            baseline: 'middle',
        });

        return labelY + SECTION_LABEL_HEIGHT;
    }

    private async drawHero(ctx: CanvasRenderingContext2D, top: LeaderboardEntry, second: LeaderboardEntry | undefined, x: number, y: number, width: number, language: LanguageEnum): Promise<void> {
        this.fillRoundedRect(ctx, x, y, width, HERO_HEIGHT, HERO_RADIUS, this.withAlpha(GOLD, 0.08));
        this.strokeRoundedRect(ctx, x, y, width, HERO_HEIGHT, HERO_RADIUS, {
            color: this.withAlpha(GOLD, 0.28),
            width: 1 * SCALE,
        });

        const stripeWidth = 4 * SCALE;
        this.fillRoundedRect(ctx, x, y, stripeWidth, HERO_HEIGHT, stripeWidth / 2, GOLD);

        const avatarX = x + 18 * SCALE;
        const avatarY = y + (HERO_HEIGHT - HERO_AVATAR_SIZE) / 2;
        this.drawAvatarBadge(ctx, top.Name, avatarX, avatarY, HERO_AVATAR_SIZE, GOLD, 26 * SCALE);
        await this.drawMedalIcon(ctx, 1, avatarX + HERO_AVATAR_SIZE - 4 * SCALE, avatarY - 2 * SCALE, 28 * SCALE);

        const textLeft = avatarX + HERO_AVATAR_SIZE + 16 * SCALE;
        const pointsBlockWidth = 140 * SCALE;
        const textMaxWidth = x + width - textLeft - pointsBlockWidth;

        const rankY = y + 16 * SCALE;
        let rankLabel = getMultiLingualString(i18n.commands.leaderboard.labels.rankLeader, language);
        if (second) {
            const lead = top.TotalPoints - second.TotalPoints;
            rankLabel += `  ${i18n.commands.leaderboard.labels.leadVsSecond(formatNumber(lead)).getMessage(language)}`;
        }
        this.drawText(ctx, rankLabel, textLeft, rankY, {
            font: `700 ${10.5 * SCALE}px ${FONT_MONO}`,
            color: GOLD,
            baseline: 'top',
        });

        const flag = await this.getFlagAsync(top);
        const flagSize = 16 * SCALE;
        const nameStyle: TextStyle = {
            font: `700 ${16 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            baseline: 'top',
        };
        ctx.font = nameStyle.font;
        const flagWidth = flag ? flagSize + 6 * SCALE : 0;
        const nameY = rankY + 16 * SCALE;
        const truncatedName = this.truncateText(ctx, top.Name, textMaxWidth - flagWidth);
        this.drawText(ctx, truncatedName, textLeft, nameY, nameStyle);
        if (flag) {
            const nameWidth = ctx.measureText(truncatedName).width;
            ctx.drawImage(flag, textLeft + nameWidth + 6 * SCALE, nameY + 2 * SCALE, flagSize, flagSize);
        }

        this.drawText(ctx, this.getSubtitleText(top, language), textLeft, nameY + 22 * SCALE, {
            font: `500 ${11 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_MUTED,
            baseline: 'top',
        });

        const pointsRight = x + width - 16 * SCALE;
        const pointsStyle: TextStyle = {
            font: `700 ${24 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT,
            align: 'right',
            baseline: 'top',
        };
        this.drawText(ctx, formatNumber(top.TotalPoints), pointsRight, y + 20 * SCALE, pointsStyle);
        this.drawText(ctx, getMultiLingualString(i18n.commands.leaderboard.labels.points, language), pointsRight, y + 20 * SCALE + 28 * SCALE, {
            font: `600 ${9 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT_FAINT,
            align: 'right',
            baseline: 'top',
        });
    }

    private async drawRows(ctx: CanvasRenderingContext2D, rows: LeaderboardEntry[], x: number, y: number, width: number, height: number, language: LanguageEnum): Promise<void> {
        this.fillRoundedRect(ctx, x, y, width, height, ROWS_RADIUS, COLOR_PANEL);
        this.strokeRoundedRect(ctx, x, y, width, height, ROWS_RADIUS, {
            color: COLOR_PANEL_BORDER,
            width: 1 * SCALE,
        });

        ctx.save();
        this.roundedRectPath(ctx, x, y, width, height, ROWS_RADIUS);
        ctx.clip();

        for (let i = 0; i < rows.length; i++) {
            const entry = rows[i];
            const rank = i + 2;
            const rowY = y + i * ROW_HEIGHT;
            if (i > 0) {
                ctx.fillStyle = COLOR_DIVIDER;
                ctx.fillRect(x, rowY, width, 1 * SCALE);
            }
            await this.drawRow(ctx, entry, rank, x, rowY, width, language);
        }

        ctx.restore();
    }

    private async drawRow(ctx: CanvasRenderingContext2D, entry: LeaderboardEntry, rank: number, x: number, y: number, width: number, language: LanguageEnum): Promise<void> {
        const stripeColor = RANK_COLORS[rank - 1] ?? COLOR_PACK.accent;
        this.fillRoundedRect(ctx, x, y, 3 * SCALE, ROW_HEIGHT, 1.5 * SCALE, stripeColor);

        const rankCellX = x + 16 * SCALE;
        const rankCellCenterY = y + ROW_HEIGHT / 2;
        if (rank <= 3) {
            await this.drawMedalIcon(ctx, rank, rankCellX, rankCellCenterY, 24 * SCALE);
        } else {
            this.drawText(ctx, String(rank).padStart(2, '0'), rankCellX, rankCellCenterY, {
                font: `700 ${13 * SCALE}px ${FONT_MONO}`,
                color: COLOR_TEXT_FAINT,
                align: 'center',
                baseline: 'middle',
            });
        }

        const avatarX = x + 34 * SCALE;
        const avatarY = y + (ROW_HEIGHT - ROW_AVATAR_SIZE) / 2;
        this.drawAvatarBadge(ctx, entry.Name, avatarX, avatarY, ROW_AVATAR_SIZE, stripeColor, 13 * SCALE);

        const textLeft = avatarX + ROW_AVATAR_SIZE + 12 * SCALE;
        const pointsBlockWidth = 100 * SCALE;
        const textMaxWidth = x + width - 16 * SCALE - textLeft - pointsBlockWidth;

        const flag = await this.getFlagAsync(entry);
        const flagSize = 13 * SCALE;
        const nameStyle: TextStyle = {
            font: `600 ${13 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            baseline: 'top',
        };
        ctx.font = nameStyle.font;
        const flagWidth = flag ? flagSize + 6 * SCALE : 0;
        const nameY = y + 12 * SCALE;
        const truncatedName = this.truncateText(ctx, entry.Name, textMaxWidth - flagWidth);
        this.drawText(ctx, truncatedName, textLeft, nameY, nameStyle);
        if (flag) {
            const nameWidth = ctx.measureText(truncatedName).width;
            ctx.drawImage(flag, textLeft + nameWidth + 6 * SCALE, nameY + 1 * SCALE, flagSize, flagSize);
        }

        this.drawText(ctx, this.getSubtitleText(entry, language), textLeft, nameY + 19 * SCALE, {
            font: `500 ${10.5 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_MUTED,
            baseline: 'top',
        });

        const pointsRight = x + width - 16 * SCALE;
        this.drawText(ctx, i18n.commands.leaderboard.labels.ptsSuffix(formatNumber(entry.TotalPoints)).getMessage(language), pointsRight, y + ROW_HEIGHT / 2, {
            font: `700 ${13.5 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT,
            align: 'right',
            baseline: 'middle',
        });
    }

    private drawEmptyState(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, language: LanguageEnum): void {
        this.fillRoundedRect(ctx, x, y, width, height, HERO_RADIUS, COLOR_PANEL);
        this.strokeRoundedRect(ctx, x, y, width, height, HERO_RADIUS, {
            color: COLOR_PANEL_BORDER,
            width: 1 * SCALE,
        });
        this.drawText(ctx, getMultiLingualString(i18n.commands.leaderboard.labels.noPointsRecorded, language), x + width / 2, y + height / 2, {
            font: `600 ${13 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_MUTED,
            align: 'center',
            baseline: 'middle',
        });
    }

    private drawFooter(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, language: LanguageEnum): void {
        this.fillCircle(ctx, x + 2.5 * SCALE, y + FOOTER_HEIGHT / 2, 2.5 * SCALE, COLOR_PACK.accent);
        this.drawText(ctx, getMultiLingualString(i18n.commands.leaderboard.labels.updatedJustNow, language), x + 10 * SCALE, y + FOOTER_HEIGHT / 2, {
            font: `500 ${9.5 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_FAINT,
            baseline: 'middle',
        });
        const boardText = i18n.commands.leaderboard.labels.boardFooter(packageJson.name.toUpperCase()).getMessage(language);
        this.drawText(ctx, boardText, x + width, y + FOOTER_HEIGHT / 2, {
            font: `${9.5 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT_FAINT,
            align: 'right',
            baseline: 'middle',
        });
    }

    private drawAvatarBadge(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, size: number, accent: Color, fontSize: number): void {
        const radius = size * 0.22;
        const grad = ctx.createLinearGradient(x, y, x + size, y + size);
        grad.addColorStop(0, this.withAlpha(accent, 0.9));
        grad.addColorStop(1, COLOR_PACK.mid);
        this.fillRoundedRect(ctx, x, y, size, size, radius, grad);

        this.drawText(ctx, getInitials(name), x + size / 2, y + size / 2 + 1 * SCALE, {
            font: `700 ${fontSize}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            align: 'center',
            baseline: 'middle',
        });
    }

    private async getFlagAsync(entry: LeaderboardEntry): Promise<Image | null> {
        if (!entry.Flag)
            return null;
        return await loadLanguageImageAsync(entry.Flag);
    }

    private getSubtitleText(entry: LeaderboardEntry, language: LanguageEnum): string {
        switch (entry.SubtitleType) {
            case LeaderboardSubtitleTypeEnum.LEVEL:
                return i18n.commands.leaderboard.labels.levelLabel(String(entry.SubtitleValue)).getMessage(language);
            case LeaderboardSubtitleTypeEnum.MEMBERS:
            default:
                return i18n.commands.leaderboard.labels.membersCount(formatNumber(entry.SubtitleValue)).getMessage(language);
        }
    }

    private async drawMedalIcon(ctx: CanvasRenderingContext2D, rank: number, centerX: number, centerY: number, size: number): Promise<void> {
        const image = await loadMedalImageAsync(rank);
        if (!image)
            return;
        ctx.drawImage(image, centerX - size / 2, centerY - size / 2, size, size);
    }
}

export default new LeaderboardCardService();
