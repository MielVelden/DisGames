import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
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
    COLOR_CHIP_BORDER,
    COLOR_DIVIDER,
    COLOR_DIVIDER_STRONG,
    COLOR_PROGRESS_TRACK,
} from './CardTokens';
import { drawCardBackground, drawBrand } from './CardChrome';
import BadgeRowRenderer from './renderers/BadgeRowRenderer';
import { formatDate } from '../../utils/helpers/Date';
import { Color } from '../../utils/helpers/Color';
import { LanguageEnum, UserRoleEnum } from '../../interfaces/enums';
import { DEFAULT_LANGUAGE, getMultiLingualString } from '../../utils/i18n/MultiLingualString';
import { i18n } from '../../utils/i18n/i18n';
import { formatNumber } from '../../utils/helpers/Number';
import { getInitials } from '../../utils/helpers/String';
import { ProfileBadge, ProfileCardData, ProfileFavoriteGame } from '../../interfaces/view';

const CARD_WIDTH = 840 * SCALE;
const CARD_HEIGHT = 360 * SCALE;
const CARD_PADDING = 22 * SCALE;

const COLUMN_GAP = 22 * SCALE;
const COLUMN_WIDTH = (CARD_WIDTH - CARD_PADDING * 2 - COLUMN_GAP) / 2;
const LEFT_COLUMN_X = CARD_PADDING;
const RIGHT_COLUMN_X = CARD_PADDING + COLUMN_WIDTH + COLUMN_GAP;

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

        drawCardBackground(ctx, CARD_WIDTH, CARD_HEIGHT);
        drawBrand(ctx, CARD_WIDTH);

        let leftY = HEADER_TOP;
        this.drawHeader(ctx, data, LEFT_COLUMN_X, leftY, COLUMN_WIDTH, language);
        leftY += AVATAR_SIZE + SECTION_GAP;

        this.drawStats(ctx, data, LEFT_COLUMN_X, leftY, COLUMN_WIDTH);
        leftY += CHIP_HEIGHT + SECTION_GAP;

        this.drawLevelBlock(ctx, data, LEFT_COLUMN_X, leftY, COLUMN_WIDTH);
        leftY += LEVEL_BLOCK_HEIGHT + SECTION_GAP;

        if (data.favoriteGame) {
            this.drawFavorite(ctx, 'FAVORITE GAME', data.favoriteGame, LEFT_COLUMN_X, leftY, COLUMN_WIDTH, language);
            if (data.leastFavoriteGame) {
                const leastFavY = leftY + FAV_ICON_SIZE + 8 * SCALE;
                this.drawFavorite(ctx, 'LEAST PLAYED', data.leastFavoriteGame, LEFT_COLUMN_X, leastFavY, COLUMN_WIDTH, language);
            }
        }

        const rightHeight = CARD_HEIGHT - HEADER_TOP - CARD_PADDING;
        await this.drawBadges(ctx, data.badges ?? [], RIGHT_COLUMN_X, HEADER_TOP, COLUMN_WIDTH, rightHeight, language);

        await fs.promises.writeFile(filepath, canvas.toBuffer('image/png'));

        return this.buildMedia(uniqueCode, filepath, {
            name: `${data.UserId}-${uniqueCode}`,
        });
    }

    private validateData(data: ProfileCardData): void {
        if (!data.CreatedAt)
            data.CreatedAt = new Date();
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

        this.drawText(ctx, String(data.Level.currentLevel), innerX + lvlPrefixW + 6 * SCALE, innerY + 28 * SCALE, {
            font: `800 ${30 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT,
        });

        const xpText = `${formatNumber(data.Level.xpNow)} / ${formatNumber(data.Level.xpMax)} XP`;
        const xpStyle: TextStyle = {
            font: `600 ${11.5 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT_MUTED,
        };
        ctx.font = xpStyle.font;
        const xpW = ctx.measureText(xpText).width;
        this.drawText(ctx, xpText, innerX + innerW - xpW, innerY + 22 * SCALE, xpStyle);

        const barY = innerY + 40 * SCALE;
        const pct = data.Level.progress / 100;
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

    private async drawBadges(ctx: CanvasRenderingContext2D, badges: ProfileBadge[], x: number, y: number, width: number, height: number, language: LanguageEnum): Promise<void> {
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

        await Promise.all(visible.map((badge, i) => {
            const rowY = y + i * rowHeight;
            if (i > 0) {
                ctx.fillStyle = COLOR_DIVIDER;
                ctx.fillRect(x, rowY, width, 1 * SCALE);
            }
            return BadgeRowRenderer.draw(ctx, badge, x, rowY, width, rowHeight, language);
        }));

        ctx.restore();
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
}

export default new ProfileCardService();
