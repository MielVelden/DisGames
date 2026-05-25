import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { GameDataModel } from '../../interfaces/database/TableInterfaces';
import { GeneratedMedia } from '../../interfaces/application/Media';
import { ExceptionEnum, GameTypeEnum, LanguageEnum } from '../../interfaces/enums';
import Logger from '../../utils/application/Logger';
import { STRING_DELIMITER } from '../../constants';
import { ErrorHelper } from '../../utils/application/Error';
import { BaseCard } from './BaseCard';

interface CategoryData {
    categoryName: string;
    words: string[];
    categoryIndex: number;
}

interface ConnectionItem {
    text: string;
    type: 'word' | 'category';
    isSolved: boolean;
    categoryIndex?: number;
    categoryName?: string;
}

const LONG_WORD_MIN_LENGTH = 10;
const MIN_CELL_FONT_SIZE = 12;

interface ConnectionImageConfig {
    canvasSize: number;
    gridSize: number;
    cellPadding: number;
    fontSize: number;
    borderRadius: number;
    backgroundColor: string;
    cellBackgroundColor: string;
    textColor: string;
    groupedBackgroundColors: string[];
}

class ConnectionImageService extends BaseCard {
    private readonly defaultConfig: ConnectionImageConfig = {
        canvasSize: 800,
        gridSize: 4,
        cellPadding: 10,
        fontSize: 32,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        cellBackgroundColor: '#e0e0e0',
        textColor: '#000000',
        groupedBackgroundColors: ['#6434e9', '#49cc5c', '#fb6640', '#2c7ce5']
    };

    constructor() {
        super(path.join('images', 'games'));
    }

    public async generateGameImage(
        gameDataArray: GameDataModel[],
        serverId: string,
        language: LanguageEnum = LanguageEnum.NL,
        solvedCategories?: number[]
    ): Promise<GeneratedMedia> {
        try {
            if (gameDataArray.length !== 4) {
                throw new Error(`Expected 4 GameData objects, got ${gameDataArray.length}`);
            }

            const categoriesData = this.parseWordsFromGameDataArray(gameDataArray, language);
            const gridItems = this.createGridStructureWithCategories(categoriesData, solvedCategories);

            const uniqueCode = this.generateUniqueCode();
            const filename = `${serverId}-${uniqueCode}.png`;

            const gameDirectory = path.join(this.imagesPath, GameTypeEnum.CONNECTIONS.toString());
            this.ensureDirectoryExists(gameDirectory);

            const filepath = path.join(gameDirectory, filename);

            await this.generateImageFile(gridItems, filepath);

            Logger.logInfo(`Game image generated: ${filepath}`);
            return this.buildMedia(uniqueCode, filepath, {
                name: `${serverId}-${uniqueCode}`,
                gameId: gameDataArray[0].GameId,
                serverId: serverId,
            });

        } catch (error) {
            Logger.logError(`Error generating game image: ${error}`);
            ErrorHelper.wrap(error, ExceptionEnum.GAME_IMAGE_GENERATION_FAILED);
        }
    }

    private parseWordsFromGameDataArray(gameDataArray: GameDataModel[], language: LanguageEnum): CategoryData[] {
        try {
            const categoriesData: CategoryData[] = [];

            for (let i = 0; i < gameDataArray.length; i++) {
                const gameData = gameDataArray[i];

                const categoryName = gameData.Message.getMessage(language);
                if (!categoryName)
                    throw new Error(`No category name found for language: ${language} at index ${i}`);

                const responseString = gameData.Response.getMessage(language);
                if (!responseString)
                    throw new Error(`No response found for language: ${language} at index ${i}`);

                const words = responseString.split(STRING_DELIMITER)
                    .map((word: string) => word.trim().toUpperCase())
                    .slice(0, 4);

                if (words.length !== 4)
                    throw new Error(`Expected 4 words for category ${i}, got ${words.length}`);

                categoriesData.push({
                    categoryName: categoryName.toUpperCase(),
                    words: words,
                    categoryIndex: i
                });
            }

            return categoriesData;
        } catch (error) {
            Logger.logError(`Error parsing categories from gameData: ${error}`);
            throw new Error(`Failed to parse categories: ${error}`);
        }
    }

    private createGridStructureWithCategories(categoriesData: CategoryData[], solvedCategories?: number[]): ConnectionItem[] {
        const solvedCategoryIndices = solvedCategories || [];
        const gridLayout: ConnectionItem[] = new Array(16).fill(null).map(() => ({
            text: '',
            type: 'word' as const,
            isSolved: false
        }));

        let currentPosition = 0;

        solvedCategoryIndices.forEach(categoryIndex => {
            const categoryData = categoriesData.find(cat => cat.categoryIndex === categoryIndex);
            if (categoryData && currentPosition < 16) {
                const wordsText = categoryData.words.join(', ');
                const categoryText = `${categoryData.categoryName}\n${wordsText}`;

                gridLayout[currentPosition] = {
                    text: categoryText,
                    type: 'category',
                    isSolved: true,
                    categoryIndex: categoryIndex,
                    categoryName: categoryData.categoryName
                };

                currentPosition += 4;
            }
        });

        const unsolvedWords: { word: string; categoryIndex: number; categoryName: string }[] = [];

        categoriesData.forEach(category => {
            if (!solvedCategoryIndices.includes(category.categoryIndex)) {
                category.words.forEach(word => {
                    unsolvedWords.push({
                        word: word,
                        categoryIndex: category.categoryIndex,
                        categoryName: category.categoryName
                    });
                });
            }
        });

        const shuffledWords = this.shuffleArray([...unsolvedWords]);

        let wordIndex = 0;
        for (let i = currentPosition; i < 16 && wordIndex < shuffledWords.length; i++) {
            gridLayout[i] = {
                text: shuffledWords[wordIndex].word,
                type: 'word',
                isSolved: false,
                categoryIndex: shuffledWords[wordIndex].categoryIndex
            };
            wordIndex++;
        }

        return gridLayout;
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private async generateImageFile(gridItems: ConnectionItem[], filepath: string): Promise<void> {
        const config = this.defaultConfig;
        const canvas = createCanvas(config.canvasSize, config.canvasSize);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, config.canvasSize, config.canvasSize);

        const cellSize = (config.canvasSize - (config.cellPadding * (config.gridSize + 1))) / config.gridSize;

        for (let i = 0; i < gridItems.length; i++) {
            const gridItem = gridItems[i];
            if (!gridItem || !gridItem.text) continue;

            const row = Math.floor(i / config.gridSize);
            const col = i % config.gridSize;

            const x = config.cellPadding + col * (cellSize + config.cellPadding);
            const y = config.cellPadding + row * (cellSize + config.cellPadding);

            if (gridItem.type === 'category') {
                const barWidth = cellSize * 4 + config.cellPadding * 3;
                this.drawCategoryBar(ctx, x, y, barWidth, cellSize, gridItem, config);
                i += 3;
            } else {
                this.drawCell(ctx, x, y, cellSize, gridItem, config);
            }
        }

        const buffer = canvas.toBuffer('image/png');
        // TODO(feat-customization merge): switch to fs.promises.writeFile; ProfileCard.ts has the canonical async write pattern.
        fs.writeFileSync(filepath, buffer);
    }

    private drawCell(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
        gridItem: ConnectionItem,
        config: ConnectionImageConfig
    ): void {
        this.fillRoundedRect(ctx, x, y, size, size, config.borderRadius, config.cellBackgroundColor);

        ctx.fillStyle = config.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxWidth = size - (config.cellPadding * 2);
        this.drawWrappedTextFitted(
            ctx,
            gridItem.text,
            x + size / 2,
            y + size / 2,
            maxWidth,
            config.fontSize,
            (fontSize) => `bold ${fontSize}px Arial`
        );
    }

    private drawCategoryBar(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        gridItem: ConnectionItem,
        config: ConnectionImageConfig
    ): void {
        const colorIndex = gridItem.categoryIndex || 0;
        const backgroundColor = config.groupedBackgroundColors[colorIndex % config.groupedBackgroundColors.length];

        this.fillRoundedRect(ctx, x, y, width, height, config.borderRadius, backgroundColor);

        ctx.fillStyle = '#ffffff';

        const textParts = gridItem.text.split('\n');
        const categoryName = textParts[0] || '';
        const words = textParts[1] || '';

        ctx.font = `bold ${config.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const categoryY = y + height / 2 - (words ? config.fontSize / 2 : 0);
        ctx.fillText(categoryName, x + width / 2, categoryY);

        if (words) {
            const smallFontSize = config.fontSize / 2;
            ctx.font = `${smallFontSize}px Arial`;
            const wordsY = y + height / 2 + smallFontSize / 2;

            const maxWidth = width - (config.cellPadding * 2);
            this.drawWrappedTextFitted(
                ctx,
                words,
                x + width / 2,
                wordsY,
                maxWidth,
                smallFontSize,
                (fontSize) => `${fontSize}px Arial`
            );
        }
    }

    private allWordsFitAtWidth(
        ctx: CanvasRenderingContext2D,
        text: string,
        maxWidth: number
    ): boolean {
        const paragraphs = text.split('\n');
        for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') continue;
            for (const word of paragraph.split(/\s+/)) {
                if (word === '') continue;
                if (ctx.measureText(word).width > maxWidth) return false;
            }
        }
        return true;
    }

    private hyphenateWordToFit(
        word: string,
        ctx: CanvasRenderingContext2D,
        maxWidth: number
    ): string {
        if (ctx.measureText(word).width <= maxWidth) return word;
        if (word.length < 2) return word;
        const mid = Math.floor(word.length / 2);
        const left = word.slice(0, mid);
        const right = word.slice(mid);
        return `${this.hyphenateWordToFit(left, ctx, maxWidth)}-${this.hyphenateWordToFit(right, ctx, maxWidth)}`;
    }

    private applyHyphenationToLongOverflowWords(
        text: string,
        ctx: CanvasRenderingContext2D,
        maxWidth: number
    ): string {
        const paragraphs = text.split('\n');
        const out: string[] = [];
        for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') {
                out.push(paragraph);
                continue;
            }
            const pieces = paragraph.split(' ').map((token) => {
                if (token.length < LONG_WORD_MIN_LENGTH) return token;
                if (ctx.measureText(token).width <= maxWidth) return token;
                return this.hyphenateWordToFit(token, ctx, maxWidth);
            });
            out.push(pieces.join(' '));
        }
        return out.join('\n');
    }

    private computeWrappedLines(
        ctx: CanvasRenderingContext2D,
        text: string,
        maxWidth: number
    ): string[] {
        const paragraphs = text.split('\n');
        const allLines: string[] = [];

        paragraphs.forEach((paragraph) => {
            if (paragraph.trim() === '') {
                allLines.push('');
                return;
            }

            const words = paragraph.split(' ');
            let line = '';

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const testWidth = ctx.measureText(testLine).width;

                if (testWidth > maxWidth && n > 0) {
                    allLines.push(line.trim());
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            if (line.trim()) {
                allLines.push(line.trim());
            }
        });

        return allLines;
    }

    private drawWrappedTextFitted(
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        baseFontSize: number,
        getFont: (fontSize: number) => string
    ): void {
        let fontSize = baseFontSize;
        let displayText = text;

        while (fontSize >= MIN_CELL_FONT_SIZE) {
            ctx.font = getFont(fontSize);
            displayText = text;
            if (!this.allWordsFitAtWidth(ctx, displayText, maxWidth)) {
                fontSize -= 1;
                continue;
            }
            const lines = this.computeWrappedLines(ctx, displayText, maxWidth);
            const linesOk = lines.every((line) => line === '' || ctx.measureText(line).width <= maxWidth);
            if (linesOk) {
                this.drawWrappedLineBlocks(ctx, lines, x, y, fontSize);
                return;
            }
            fontSize -= 1;
        }

        ctx.font = getFont(MIN_CELL_FONT_SIZE);
        displayText = this.applyHyphenationToLongOverflowWords(text, ctx, maxWidth);
        const lines = this.computeWrappedLines(ctx, displayText, maxWidth);
        this.drawWrappedLineBlocks(ctx, lines, x, y, MIN_CELL_FONT_SIZE);
    }

    private drawWrappedLineBlocks(
        ctx: CanvasRenderingContext2D,
        lines: string[],
        x: number,
        y: number,
        fontSize: number
    ): void {
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = y - totalHeight / 2 + lineHeight / 2;

        lines.forEach((line, index) => {
            ctx.fillText(line, x, startY + index * lineHeight);
        });
    }

}

export default new ConnectionImageService();
