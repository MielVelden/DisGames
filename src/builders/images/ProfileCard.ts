import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { GeneratedMedia } from '../../interfaces/application/Media';
import { BaseCard, TextStyle } from './BaseCard';
import { SCALE, FONT_SANS, FONT_MONO } from './CardTokens';
import { PROJECT_NAME } from '../../utils/constants/Project';
import { formatDate } from '../../utils/helpers/Date';
import { Color } from '../../utils/helpers/Color';
import { LanguageEnum, UserRoleEnum } from '../../interfaces/enums';
import { DEFAULT_LANGUAGE, getMultiLingualString } from '../../utils/i18n/MultiLingualString';
import { i18n } from '../../utils/i18n/i18n';
import { AchievementEnum } from '../../interfaces/enums/database/AchievementEnum';
import { getEnumProperty } from '../../utils/helpers/EnumMetadata';
import { MetadataKeyEnum } from '../../interfaces/enums/application/MetadataKeyEnum';
import { formatNumber } from '../../utils/helpers/Number';
import { getInitials } from '../../utils/helpers/String';
import { ProfileAchievement, ProfileCardData, ProfileFavoriteGame } from '../../interfaces/view';

interface ColorPack {
    deep: Color;
    base: Color;
    mid: Color;
    accent: Color;
    accent2: Color;
}

const CARD_WIDTH = 840 * SCALE;
const CARD_HEIGHT = 360 * SCALE;
const CARD_PADDING = 22 * SCALE;
const CARD_RADIUS = 18 * SCALE;
const CARD_BORDER_COLOR = 'rgba(255,255,255,0.08)';

const COLUMN_GAP = 22 * SCALE;
const COLUMN_WIDTH = (CARD_WIDTH - CARD_PADDING * 2 - COLUMN_GAP) / 2;
const LEFT_COLUMN_X = CARD_PADDING;
const RIGHT_COLUMN_X = CARD_PADDING + COLUMN_WIDTH + COLUMN_GAP;

const COLOR_TEXT = '#f3eefe';
const COLOR_TEXT_MUTED = '#a5a0c9';
const COLOR_TEXT_FAINT = '#6b67a0';
const COLOR_PANEL = 'rgba(0,0,0,0.18)';
const COLOR_PANEL_BORDER = 'rgba(255,255,255,0.06)';
const COLOR_CHIP_BG = 'rgba(255,255,255,0.04)';
const COLOR_CHIP_BORDER = 'rgba(255,255,255,0.06)';
const COLOR_DIVIDER = 'rgba(255,255,255,0.06)';
const COLOR_DIVIDER_STRONG = 'rgba(255,255,255,0.10)';
const COLOR_PROGRESS_TRACK = 'rgba(0,0,0,0.4)';
const COLOR_STATUS_ONLINE = '#3ec875';
const COLOR_STATUS_OFFLINE = '#6b67a0';

const COLOR_PACK: ColorPack = {
    deep: '#1a1742',
    base: '#27245C',
    mid: '#312898',
    accent: '#D938C8',
    accent2: '#7C3BFF'
};

const AVATAR_SIZE = 64 * SCALE;
const AVATAR_RADIUS = 16 * SCALE;
const AVATAR_INNER_RADIUS = 14 * SCALE;
const AVATAR_RING_WIDTH = 2 * SCALE;

const SECTION_GAP = 16 * SCALE;
const HEADER_TOP = CARD_PADDING + 8 * SCALE;
const AVATAR_TEXT_GAP = 14 * SCALE;

const CHIP_HEIGHT = 54 * SCALE;
const CHIP_RADIUS = 10 * SCALE;
const CHIP_GAP = 10 * SCALE;
const CHIP_ICON_SIZE = 30 * SCALE;
const CHIP_ICON_RADIUS = 8 * SCALE;

const LEVEL_BLOCK_HEIGHT = 84 * SCALE;
const LEVEL_BLOCK_RADIUS = 12 * SCALE;
const PROGRESS_HEIGHT = 10 * SCALE;
const PROGRESS_RADIUS = 5 * SCALE;
const PROGRESS_TIP_RADIUS = 7 * SCALE;

const FAV_HEIGHT = 22 * SCALE;
const FAV_ICON_SIZE = 22 * SCALE;
const FAV_ICON_RADIUS = 6 * SCALE;

const BADGES_RADIUS = 12 * SCALE;
const BADGE_ROW_HEIGHT = 70 * SCALE;
const BADGE_ICON_SIZE = 36 * SCALE;
const BADGE_ICON_RADIUS = 9 * SCALE;
const BADGE_ACCENT_WIDTH = 4 * SCALE;

const BRAND_TOP = 14 * SCALE;
const BRAND_RIGHT = 16 * SCALE;

class ProfileCardService extends BaseCard {
    constructor() {
        super(path.join('images', 'generated'));
    }

    public async generateAsync(data: ProfileCardData, language: LanguageEnum = DEFAULT_LANGUAGE): Promise<GeneratedMedia> {
        this.validateData(data);

        const uniqueCode = this.generateUniqueCode();
        const filepath = path.join(this.imagesPath, `${data.UserId}-${uniqueCode}.png`);

        const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
        const ctx = canvas.getContext('2d');

        this.drawCardBackground(ctx);
        this.drawBrand(ctx);

        let leftY = HEADER_TOP;
        this.drawHeader(ctx, data, LEFT_COLUMN_X, leftY, COLUMN_WIDTH, language);
        leftY += AVATAR_SIZE + SECTION_GAP;

        this.drawStats(ctx, data, LEFT_COLUMN_X, leftY, COLUMN_WIDTH);
        leftY += CHIP_HEIGHT + SECTION_GAP;

        this.drawLevelBlock(ctx, data, LEFT_COLUMN_X, leftY, COLUMN_WIDTH);
        leftY += LEVEL_BLOCK_HEIGHT + SECTION_GAP;

        this.drawFavorite(ctx, 'FAVORITE GAME', data.favoriteGame, LEFT_COLUMN_X, leftY, COLUMN_WIDTH, language);
        if (data.leastFavoriteGame) {
            const leastFavY = leftY + FAV_ICON_SIZE + 8 * SCALE;
            this.drawFavorite(ctx, 'LEAST PLAYED', data.leastFavoriteGame, LEFT_COLUMN_X, leastFavY, COLUMN_WIDTH, language);
        }

        const rightHeight = CARD_HEIGHT - HEADER_TOP - CARD_PADDING;
        this.drawBadges(ctx, data.achievements ?? [], RIGHT_COLUMN_X, HEADER_TOP, COLUMN_WIDTH, rightHeight, language);

        await fs.promises.writeFile(filepath, canvas.toBuffer('image/png'));

        return this.buildMedia(uniqueCode, filepath, {
            name: `${data.UserId}-${uniqueCode}`,
        });
    }

    private validateData(data: ProfileCardData): void {
        if (!data.CreatedAt)
            data.CreatedAt = new Date();
    }

    private drawCardBackground(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        this.roundedRectPath(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
        ctx.clip();

        const base = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
        base.addColorStop(0, COLOR_PACK.base);
        base.addColorStop(1, COLOR_PACK.deep);
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

        const topRight = ctx.createRadialGradient(CARD_WIDTH, 0, 0, CARD_WIDTH, 0, 420 * SCALE);
        topRight.addColorStop(0, this.withAlpha(COLOR_PACK.accent, 0.24));
        topRight.addColorStop(1, this.withAlpha(COLOR_PACK.accent, 0));
        ctx.fillStyle = topRight;
        ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

        const bottomLeft = ctx.createRadialGradient(0, CARD_HEIGHT, 0, 0, CARD_HEIGHT, 360 * SCALE);
        bottomLeft.addColorStop(0, this.withAlpha(COLOR_PACK.accent2, 0.18));
        bottomLeft.addColorStop(1, this.withAlpha(COLOR_PACK.accent2, 0));
        ctx.fillStyle = bottomLeft;
        ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

        ctx.restore();

        this.strokeRoundedRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS, {
            color: CARD_BORDER_COLOR,
            width: 1 * SCALE,
        });
    }

    private drawBrand(ctx: CanvasRenderingContext2D): void {
        const text = PROJECT_NAME.toUpperCase();
        const fontSize = 10 * SCALE;
        const brandStyle: TextStyle = {
            font: `600 ${fontSize}px ${FONT_MONO}`,
            color: COLOR_TEXT_FAINT,
            baseline: 'middle',
        };
        ctx.font = brandStyle.font;
        const textWidth = ctx.measureText(text).width;
        const dotR = 2.5 * SCALE;
        const gap = 5 * SCALE;
        const totalWidth = dotR * 2 + gap + textWidth;
        const right = CARD_WIDTH - BRAND_RIGHT;
        const top = BRAND_TOP + fontSize / 2;
        const dotCx = right - totalWidth + dotR;

        this.fillCircle(ctx, dotCx, top, dotR + 1.5 * SCALE, this.withAlpha(COLOR_PACK.accent, 0.2));
        this.fillCircle(ctx, dotCx, top, dotR, COLOR_PACK.accent);

        this.drawText(ctx, text, dotCx + dotR + gap, top, brandStyle);
    }

    private drawHeader(ctx: CanvasRenderingContext2D, data: ProfileCardData, x: number, y: number, width: number, language: LanguageEnum): void {
        this.drawAvatar(ctx, data, x, y);

        const textLeft = x + AVATAR_SIZE + AVATAR_TEXT_GAP;
        const textMaxWidth = width - AVATAR_SIZE - AVATAR_TEXT_GAP;
        const nameY = y + 4 * SCALE;
        const nameStyle: TextStyle = {
            font: `700 ${22 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            baseline: 'top',
        };
        ctx.font = nameStyle.font;
        const truncated = this.truncateText(ctx, data.Username, textMaxWidth - 80 * SCALE);
        this.drawText(ctx, truncated, textLeft, nameY, nameStyle);

        const usernameWidth = ctx.measureText(truncated).width;
        const badgeX = textLeft + usernameWidth + 8 * SCALE;
        const badgeY = nameY + 2 * SCALE;
        this.drawRoleBadge(ctx, data.UserRoleEnum, badgeX, badgeY, language);

        const subY = nameY + 22 * SCALE + 8 * SCALE;
        this.drawHeaderSub(ctx, data, textLeft, subY, textMaxWidth);
    }

    private drawAvatar(ctx: CanvasRenderingContext2D, data: ProfileCardData, x: number, y: number): void {
        const ringGrad = ctx.createLinearGradient(x, y, x + AVATAR_SIZE, y + AVATAR_SIZE);
        ringGrad.addColorStop(0, COLOR_PACK.accent);
        ringGrad.addColorStop(0.5, COLOR_PACK.accent2);
        ringGrad.addColorStop(1, COLOR_PACK.mid);
        this.fillRoundedRect(ctx, x, y, AVATAR_SIZE, AVATAR_SIZE, AVATAR_RADIUS, ringGrad);

        const innerX = x + AVATAR_RING_WIDTH;
        const innerY = y + AVATAR_RING_WIDTH;
        const innerSize = AVATAR_SIZE - AVATAR_RING_WIDTH * 2;

        const innerGrad = ctx.createLinearGradient(innerX, innerY, innerX + innerSize, innerY + innerSize);
        innerGrad.addColorStop(0, COLOR_PACK.mid);
        innerGrad.addColorStop(1, COLOR_PACK.deep);
        this.fillRoundedRect(ctx, innerX, innerY, innerSize, innerSize, AVATAR_INNER_RADIUS, innerGrad);

        this.drawText(ctx, getInitials(data.Username),
            innerX + innerSize / 2,
            innerY + innerSize / 2 + 1 * SCALE,
            {
                font: `700 ${26 * SCALE}px ${FONT_SANS}`,
                color: COLOR_TEXT,
                align: 'center',
                baseline: 'middle',
            },
        );
    }

    private drawRoleBadge(ctx: CanvasRenderingContext2D, role: UserRoleEnum, x: number, y: number, language: LanguageEnum): void {
        const label = getMultiLingualString(i18n.enums.userRoles[role], language);
        const fontSize = 10.5 * SCALE;
        const padX = 8 * SCALE;
        const height = 22 * SCALE;
        const radius = 6 * SCALE;

        ctx.font = `700 ${fontSize}px ${FONT_SANS}`;
        const textWidth = ctx.measureText(label).width;
        const width = textWidth + padX * 2;

        let bgFill: Color | CanvasGradient;
        let textColor: Color;
        let borderColor: Color;

        if (role === UserRoleEnum.ADMIN) {
            const grad = ctx.createLinearGradient(x, y, x + width, y + height);
            grad.addColorStop(0, COLOR_PACK.accent);
            grad.addColorStop(1, COLOR_PACK.accent2);
            bgFill = grad;
            textColor = '#ffffff';
            borderColor = 'transparent';
        } else {
            bgFill = 'rgba(255,255,255,0.06)';
            textColor = COLOR_TEXT_MUTED;
            borderColor = 'rgba(255,255,255,0.10)';
        }

        this.fillRoundedRect(ctx, x, y, width, height, radius, bgFill);
        if (borderColor !== 'transparent') {
            this.strokeRoundedRect(ctx, x, y, width, height, radius, {
                color: borderColor,
                width: 1 * SCALE,
            });
        }

        this.drawText(ctx, label, x + width / 2, y + height / 2 + 1 * SCALE, {
            font: `700 ${fontSize}px ${FONT_SANS}`,
            color: textColor,
            align: 'center',
            baseline: 'middle',
        });
    }

    private drawHeaderSub(ctx: CanvasRenderingContext2D, data: ProfileCardData, x: number, y: number, maxWidth: number): void {
        const pillH = 14 * SCALE;
        const pillPad = 4 * SCALE;
        const pillFont = 9 * SCALE;
        const pillStyle: TextStyle = {
            font: `700 ${pillFont}px ${FONT_SANS}`,
            color: COLOR_TEXT_FAINT,
            align: 'center',
            baseline: 'middle',
        };
        ctx.font = pillStyle.font;
        const pillTextW = ctx.measureText('ID').width;
        const pillW = pillTextW + pillPad * 2;

        this.fillRoundedRect(ctx, x, y, pillW, pillH, 3 * SCALE, 'rgba(255,255,255,0.05)');
        this.drawText(ctx, 'ID', x + pillW / 2, y + pillH / 2 + 0.5 * SCALE, pillStyle);

        const idStyle: TextStyle = {
            font: `500 ${10.5 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT_FAINT,
            baseline: 'middle',
        };
        ctx.font = idStyle.font;
        const idX = x + pillW + 5 * SCALE;
        const idText = this.truncateText(ctx, data.UserId, maxWidth * 0.45);
        this.drawText(ctx, idText, idX, y + pillH / 2 + 0.5 * SCALE, idStyle);
        const idW = ctx.measureText(idText).width;

        const dotX = idX + idW + 8 * SCALE;
        const dotCy = y + pillH / 2;
        this.fillCircle(ctx, dotX, dotCy, 1.5 * SCALE, COLOR_TEXT_FAINT);

        this.drawText(ctx, this.formatJoined(data.CreatedAt), dotX + 8 * SCALE, y + pillH / 2 + 0.5 * SCALE, {
            font: `500 ${11 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_MUTED,
            baseline: 'middle',
        });
    }

    private drawStats(ctx: CanvasRenderingContext2D, data: ProfileCardData, x: number, y: number, width: number): void {
        const chipW = (width - CHIP_GAP) / 2;

        this.drawChip(ctx, x, y, chipW,
            'PLAYER RANK',
            `#${formatNumber(data.UserRank)}`,
            ` / ${formatNumber(data.TotalUsers)}`,
            COLOR_PACK.accent,
            (cx, cy) => this.drawTrophyIcon(ctx, cx, cy, COLOR_PACK.accent),
        );

        this.drawChip(ctx, x + chipW + CHIP_GAP, y, chipW,
            'TOTAL POINTS',
            formatNumber(data.TotalPoints),
            ' pts',
            COLOR_PACK.accent2,
            (cx, cy) => this.drawStarIcon(ctx, cx, cy, COLOR_PACK.accent2, 7 * SCALE),
        );
    }

    private drawChip(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        label: string,
        value: string,
        valueSuffix: string,
        iconColor: Color,
        drawIcon: (cx: number, cy: number) => void,
    ): void {
        this.fillRoundedRect(ctx, x, y, width, CHIP_HEIGHT, CHIP_RADIUS, COLOR_CHIP_BG);
        this.strokeRoundedRect(ctx, x, y, width, CHIP_HEIGHT, CHIP_RADIUS, {
            color: COLOR_CHIP_BORDER,
            width: 1 * SCALE,
        });

        const iconX = x + 12 * SCALE;
        const iconY = y + (CHIP_HEIGHT - CHIP_ICON_SIZE) / 2;
        this.fillRoundedRect(ctx, iconX, iconY, CHIP_ICON_SIZE, CHIP_ICON_SIZE, CHIP_ICON_RADIUS,
            this.withAlpha(iconColor, 0.18));
        drawIcon(iconX + CHIP_ICON_SIZE / 2, iconY + CHIP_ICON_SIZE / 2);

        const textX = iconX + CHIP_ICON_SIZE + 10 * SCALE;
        this.drawText(ctx, label, textX, y + 12 * SCALE, {
            font: `600 ${9.5 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_FAINT,
            baseline: 'top',
        });

        const valueStyle: TextStyle = {
            font: `700 ${15 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT,
            baseline: 'top',
        };
        ctx.font = valueStyle.font;
        const valueW = ctx.measureText(value).width;
        this.drawText(ctx, value, textX, y + 27 * SCALE, valueStyle);

        this.drawText(ctx, valueSuffix, textX + valueW + 2 * SCALE, y + 31 * SCALE, {
            font: `500 ${11 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT_FAINT,
            baseline: 'top',
        });
    }

    private drawLevelBlock(ctx: CanvasRenderingContext2D, data: ProfileCardData, x: number, y: number, width: number): void {
        this.fillRoundedRect(ctx, x, y, width, LEVEL_BLOCK_HEIGHT, LEVEL_BLOCK_RADIUS, COLOR_PANEL);
        this.strokeRoundedRect(ctx, x, y, width, LEVEL_BLOCK_HEIGHT, LEVEL_BLOCK_RADIUS, {
            color: COLOR_PANEL_BORDER,
            width: 1 * SCALE,
        });

        const innerX = x + 14 * SCALE;
        const innerY = y + 14 * SCALE;
        const innerW = width - 28 * SCALE;

        const lvlPrefixStyle: TextStyle = {
            font: `600 ${10 * SCALE}px ${FONT_MONO}`,
            color: COLOR_PACK.accent,
        };
        ctx.font = lvlPrefixStyle.font;
        const lvlPrefixW = ctx.measureText('LVL').width;
        this.drawText(ctx, 'LVL', innerX, innerY + 24 * SCALE, lvlPrefixStyle);

        this.drawText(ctx, String(data.level.level), innerX + lvlPrefixW + 6 * SCALE, innerY + 28 * SCALE, {
            font: `800 ${30 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT,
        });

        const xpText = `${formatNumber(data.level.xpCurrent)} / ${formatNumber(data.level.xpMax)} XP`;
        const xpStyle: TextStyle = {
            font: `600 ${11.5 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT_MUTED,
        };
        ctx.font = xpStyle.font;
        const xpW = ctx.measureText(xpText).width;
        this.drawText(ctx, xpText, innerX + innerW - xpW, innerY + 22 * SCALE, xpStyle);

        const barY = innerY + 40 * SCALE;
        const pct = data.level.xpMax > 0 ? Math.max(0, Math.min(1, data.level.xpCurrent / data.level.xpMax)) : 0;
        this.drawProgressBar(ctx, innerX, barY, innerW, pct);
    }

    private drawProgressBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, pct: number): void {
        this.fillRoundedRect(ctx, x, y, width, PROGRESS_HEIGHT, PROGRESS_RADIUS, COLOR_PROGRESS_TRACK);

        const fillW = Math.round(width * pct);
        if (fillW <= 0) return;

        const grad = ctx.createLinearGradient(x, 0, x + fillW, 0);
        grad.addColorStop(0, COLOR_PACK.accent2);
        grad.addColorStop(1, COLOR_PACK.accent);

        ctx.save();
        this.roundedRectPath(ctx, x, y, Math.max(fillW, PROGRESS_RADIUS * 2), PROGRESS_HEIGHT, PROGRESS_RADIUS);
        ctx.clip();
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, fillW, PROGRESS_HEIGHT);
        ctx.restore();

        const tipCx = x + fillW;
        const tipCy = y + PROGRESS_HEIGHT / 2;
        this.drawRadialGlow(ctx, tipCx, tipCy, PROGRESS_TIP_RADIUS * 3, COLOR_PACK.accent, [
            [0, 0.7],
            [1, 0],
        ]);

        this.fillCircle(ctx, tipCx, tipCy, PROGRESS_TIP_RADIUS, '#ffffff');
    }

    private drawFavorite(ctx: CanvasRenderingContext2D, label: string, gameData: ProfileFavoriteGame, x: number, y: number, width: number, language: LanguageEnum): void {
        const iconX = x + 2 * SCALE;
        const iconY = y;
        this.fillRoundedRect(ctx, iconX, iconY, FAV_ICON_SIZE, FAV_ICON_SIZE, FAV_ICON_RADIUS,
            this.withAlpha(COLOR_PACK.accent2, 0.16));
        this.drawControllerIcon(ctx, iconX + FAV_ICON_SIZE / 2, iconY + FAV_ICON_SIZE / 2, COLOR_PACK.accent2);

        const midY = y + FAV_HEIGHT / 2 + 0.5 * SCALE;
        let cursorX = iconX + FAV_ICON_SIZE + 10 * SCALE;

        const labelStyle: TextStyle = {
            font: `600 ${10 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_FAINT,
            baseline: 'middle',
        };
        ctx.font = labelStyle.font;
        this.drawText(ctx, label, cursorX, midY, labelStyle);
        cursorX += ctx.measureText(label).width + 10 * SCALE;

        ctx.fillStyle = COLOR_DIVIDER_STRONG;
        ctx.fillRect(cursorX, y + (FAV_HEIGHT - 14 * SCALE) / 2, 1 * SCALE, 14 * SCALE);
        cursorX += 10 * SCALE;

        const hoursText = `${formatNumber(gameData.points)} pts`;
        const hoursStyle: TextStyle = {
            font: `500 ${11 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT_MUTED,
            baseline: 'middle',
        };
        ctx.font = hoursStyle.font;
        const hoursW = ctx.measureText(hoursText).width;
        const hoursX = x + width - hoursW - 2 * SCALE;

        const gameStyle: TextStyle = {
            font: `600 ${13 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            baseline: 'middle',
        };
        ctx.font = gameStyle.font;
        const gameMaxW = hoursX - cursorX - 8 * SCALE;
        const gameName = getMultiLingualString(i18n.enums.gameTypes[gameData.gameId].name, language);
        const game = this.truncateText(ctx, gameName, gameMaxW);
        this.drawText(ctx, game, cursorX, midY, gameStyle);

        this.drawText(ctx, hoursText, hoursX, midY, hoursStyle);
    }

    private drawBadges(ctx: CanvasRenderingContext2D, badges: ProfileAchievement[], x: number, y: number, width: number, height: number, language: LanguageEnum): void {
        const visible = badges.slice(0, 4);
        const rowHeight = visible.length > 0 ? height / visible.length : BADGE_ROW_HEIGHT;

        this.fillRoundedRect(ctx, x, y, width, height, BADGES_RADIUS, COLOR_PANEL);
        this.strokeRoundedRect(ctx, x, y, width, height, BADGES_RADIUS, {
            color: COLOR_PANEL_BORDER,
            width: 1 * SCALE,
        });

        ctx.save();
        this.roundedRectPath(ctx, x, y, width, height, BADGES_RADIUS);
        ctx.clip();

        visible.forEach((badge, i) => {
            const rowY = y + i * rowHeight;
            if (i > 0) {
                ctx.fillStyle = COLOR_DIVIDER;
                ctx.fillRect(x, rowY, width, 1 * SCALE);
            }
            this.drawBadgeRow(ctx, badge, x, rowY, width, rowHeight, language);
        });

        ctx.restore();
    }

    private drawBadgeRow(ctx: CanvasRenderingContext2D, achievement: ProfileAchievement, x: number, y: number, width: number, height: number, language: LanguageEnum): void {
        const color = getEnumProperty(AchievementEnum, achievement.achievementEnum, MetadataKeyEnum.Color) as Color;
        const icon = getEnumProperty(AchievementEnum, achievement.achievementEnum, MetadataKeyEnum.Emoji) as string;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, BADGE_ACCENT_WIDTH, height);

        const iconX = x + BADGE_ACCENT_WIDTH + 12 * SCALE;
        const iconY = y + (height - BADGE_ICON_SIZE) / 2;
        this.fillRoundedRect(ctx, iconX, iconY, BADGE_ICON_SIZE, BADGE_ICON_SIZE, BADGE_ICON_RADIUS,
            this.withAlpha(color, 0.18));
        this.strokeRoundedRect(ctx, iconX, iconY, BADGE_ICON_SIZE, BADGE_ICON_SIZE, BADGE_ICON_RADIUS, {
            color: this.withAlpha(color, 0.3),
            width: 1 * SCALE,
        });

        this.drawText(ctx, icon,
            iconX + BADGE_ICON_SIZE / 2,
            iconY + BADGE_ICON_SIZE / 2 + 1 * SCALE,
            {
                font: `${18 * SCALE}px ${FONT_SANS}`,
                color: color,
                align: 'center',
                baseline: 'middle',
            },
        );

        const dateRightPad = 12 * SCALE;
        const dateRight = x + width - dateRightPad;
        const textBlockHeight = 42 * SCALE;
        const textTop = y + (height - textBlockHeight) / 2;

        this.drawText(ctx, 'EARNED', dateRight, textTop + 1 * SCALE, {
            font: `600 ${9 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_FAINT,
            align: 'right',
            baseline: 'top',
        });

        const dateStyle: TextStyle = {
            font: `500 ${10 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT_FAINT,
            align: 'right',
            baseline: 'top',
        };
        ctx.font = dateStyle.font;

        const formattedDate = formatDate(achievement.date, true);
        const dateW = ctx.measureText(formattedDate).width;
        this.drawText(ctx, formattedDate, dateRight, textTop + 17 * SCALE, dateStyle);

        ctx.font = `600 ${9 * SCALE}px ${FONT_SANS}`;
        const earnedW = ctx.measureText('EARNED').width;
        const dateLeft = dateRight - Math.max(dateW, earnedW);

        const titleX = iconX + BADGE_ICON_SIZE + 12 * SCALE;
        const titleMaxW = dateLeft - titleX - 8 * SCALE;

        const titleStyle: TextStyle = {
            font: `600 ${13 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            baseline: 'top',
        };
        ctx.font = titleStyle.font;
        const title = getMultiLingualString(i18n.enums.achievements[achievement.achievementEnum].title, language);
        this.drawText(ctx, this.truncateText(ctx, title, titleMaxW), titleX, textTop, titleStyle);

        const descStyle: TextStyle = {
            font: `500 ${10.5 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_MUTED,
            baseline: 'top',
        };
        ctx.font = descStyle.font;
        const description = getMultiLingualString(i18n.enums.achievements[achievement.achievementEnum].description, language);
        const descLines = this.wrapText(ctx, description, titleMaxW, 2);
        descLines.forEach((line, li) => {
            this.drawText(ctx, line, titleX, textTop + 17 * SCALE + li * 13 * SCALE, descStyle);
        });
    }

    private drawTrophyIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: Color): void {
        const size = 14 * SCALE;
        const w = size;
        const h = size;
        const x = cx - w / 2;
        const y = cy - h / 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.25, y);
        ctx.lineTo(x + w * 0.75, y);
        ctx.lineTo(x + w * 0.75, y + h * 0.5);
        ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.75, x + w * 0.25, y + h * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillRect(x + w * 0.35, y + h * 0.7, w * 0.3, h * 0.15);
        ctx.fillRect(x + w * 0.2, y + h * 0.85, w * 0.6, h * 0.12);

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5 * SCALE;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.25, y + h * 0.15);
        ctx.lineTo(x, y + h * 0.15);
        ctx.lineTo(x, y + h * 0.35);
        ctx.moveTo(x + w * 0.75, y + h * 0.15);
        ctx.lineTo(x + w, y + h * 0.15);
        ctx.lineTo(x + w, y + h * 0.35);
        ctx.stroke();
    }

    private drawStarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: Color, radius: number): void {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? radius : radius / 2.3;
            const angle = (Math.PI / 5) * i - Math.PI / 2;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    private drawControllerIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: Color): void {
        const w = 14 * SCALE;
        const h = 9 * SCALE;
        const x = cx - w / 2;
        const y = cy - h / 2;

        this.fillRoundedRect(ctx, x, y, w, h, h / 2, color);

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x + w * 0.18, y + h * 0.45, w * 0.18, h * 0.1);
        ctx.fillRect(x + w * 0.25, y + h * 0.32, h * 0.1, w * 0.18 * 0.6);

        this.fillCircle(ctx, x + w * 0.72, y + h * 0.4, h * 0.1, 'rgba(0,0,0,0.35)');
        this.fillCircle(ctx, x + w * 0.84, y + h * 0.55, h * 0.1, 'rgba(0,0,0,0.35)');
    }

    private formatJoined(date: Date): string {
        // TODO: i18n
        return `Member since ${formatDate(date, true)}`;
    }

    private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let current = '';
        for (let i = 0; i < words.length; i++) {
            const test = current ? `${current} ${words[i]}` : words[i];
            if (ctx.measureText(test).width <= maxWidth) {
                current = test;
            } else {
                if (current) lines.push(current);
                if (lines.length === maxLines - 1) {
                    lines.push(this.truncateText(ctx, words.slice(i).join(' '), maxWidth));
                    return lines;
                }
                current = words[i];
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    private truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
        if (ctx.measureText(text).width <= maxWidth) return text;
        const ellipsis = '…';
        let lo = 0;
        let hi = text.length;
        while (lo < hi) {
            const mid = Math.floor((lo + hi + 1) / 2);
            if (ctx.measureText(text.slice(0, mid) + ellipsis).width <= maxWidth) lo = mid;
            else hi = mid - 1;
        }
        return text.slice(0, lo) + ellipsis;
    }
}

export default new ProfileCardService();
