import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { GameDataModel } from '../../interfaces/database/TableInterfaces';
import { GeneratedMedia } from '../../interfaces/application/Media';
import { MediaType } from '../../interfaces/application/Media';
import { UniqueCodes } from '../../utils/helpers/UniqueCodes';
import { ExceptionEnum, GameTypeEnum, LanguageEnum } from '../../interfaces/enums';
import Logger from '../../utils/application/Logger';
import { STRING_DELIMITER } from '../../constants';
import { ErrorHelper } from '../../utils/application/Error';

interface CategoryData {
    categoryName: string;
    words: string[];
    categoryIndex: number;
}

interface GridItem {
    text: string;
    type: 'word' | 'category';
    isSolved: boolean;
    categoryIndex?: number;
    categoryName?: string;
}

const LONG_WORD_MIN_LENGTH = 10;
const MIN_CELL_FONT_SIZE = 12;

interface GameImageConfig {
    canvasSize: number;
    gridSize: number;
    cellPadding: number;
    fontSize: number;
    borderWidth: number;
    borderRadius: number;
    borderColor: string;
    backgroundColor: string;
    cellBackgroundColor: string;
    textColor: string;
    groupedBackgroundColors: string[];
}

class GameImageService {
    private readonly defaultConfig: GameImageConfig = {
        canvasSize: 800,
        gridSize: 4,
        cellPadding: 10,
        fontSize: 32,
        borderWidth: 0,
        borderRadius: 12,
        borderColor: 'transparent',
        backgroundColor: '#ffffff',
        cellBackgroundColor: '#e0e0e0',
        textColor: '#000000',
        groupedBackgroundColors: ['#6434e9', '#49cc5c', '#fb6640', '#2c7ce5']
    };

    private readonly imagesPath: string;

    constructor() {
        this.imagesPath = path.join(process.cwd(), 'images', 'games');
        this.ensureDirectoryExists(this.imagesPath);
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

            const uniqueCode = UniqueCodes.generateCode(12);
            const filename = `${serverId}-${uniqueCode}.png`;
            
            const gameDirectory = path.join(this.imagesPath, GameTypeEnum.CONNECTIONS.toString());
            this.ensureDirectoryExists(gameDirectory);
            
            const filepath = path.join(gameDirectory, filename);

            await this.generateImageFile(gridItems, filepath);

            const generatedMedia: GeneratedMedia = {
                id: uniqueCode,
                url: filepath,
                name: `${serverId}-${uniqueCode}`,
                type: MediaType.PNG,
                createdAt: new Date(),
                gameId: gameDataArray[0].GameId,
                serverId: serverId
            };

            Logger.logInfo(`Game image generated: ${filepath}`);
            return generatedMedia;

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

    private createGridStructureWithCategories(categoriesData: CategoryData[], solvedCategories?: number[]): GridItem[] {
        const solvedCategoryIndices = solvedCategories || [];
        const gridLayout: GridItem[] = new Array(16).fill(null).map(() => ({
            text: '',
            type: 'word' as const,
            isSolved: false
        }));
        
        let currentPosition = 0;
        
        // Place all solved categories at the beginning
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
                
                // Reserve 4 positions for the category bar (span 4 columns)
                currentPosition += 4;
            }
        });
        
        // Gather all words from unsolved categories
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

        // Shuffle the unsolved words
        const shuffledWords = this.shuffleArray([...unsolvedWords]);
        
        // Place the unsolved words in the remaining positions
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

    private async generateImageFile(gridItems: GridItem[], filepath: string): Promise<void> {
        const config = this.defaultConfig;
        const canvas = createCanvas(config.canvasSize, config.canvasSize);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, config.canvasSize, config.canvasSize);

        // Calculate cell size
        const cellSize = (config.canvasSize - (config.cellPadding * (config.gridSize + 1))) / config.gridSize;

        // Draw grid items at the correct positions
        for (let i = 0; i < gridItems.length; i++) {
            const gridItem = gridItems[i];
            if (!gridItem || !gridItem.text) continue;

            const row = Math.floor(i / config.gridSize);
            const col = i % config.gridSize;
            
            const x = config.cellPadding + col * (cellSize + config.cellPadding);
            const y = config.cellPadding + row * (cellSize + config.cellPadding);

            // Determine if this is a category bar (4 cells wide)
            if (gridItem.type === 'category') {
                // Category bar wordt op rij positie getekend en spant 4 kolommen
                const barWidth = cellSize * 4 + config.cellPadding * 3;
                this.drawCategoryBar(ctx, x, y, barWidth, cellSize, gridItem, config);
                
                // Skip the next 3 items in this row (they are already used by the category bar)
                i += 3;
            } else {
                this.drawCell(ctx, x, y, cellSize, gridItem, config);
            }
        }

        // Write to file
        const buffer = canvas.toBuffer('image/png');
        // TODO(feat-customization merge): switch to fs.promises.writeFile; ProfileCard.ts has the canonical async write pattern.
        fs.writeFileSync(filepath, buffer);
    }

    private drawCell(
        ctx: CanvasRenderingContext2D, 
        x: number, 
        y: number, 
        size: number, 
        gridItem: GridItem, 
        config: GameImageConfig
    ): void {
        // Draw background with border radius
        this.drawRoundedRect(ctx, x, y, size, size, config.borderRadius, config.cellBackgroundColor);

        // Border (only if borderWidth > 0)
        if (config.borderWidth > 0) {
            ctx.strokeStyle = config.borderColor;
            ctx.lineWidth = config.borderWidth;
            this.strokeRoundedRect(ctx, x, y, size, size, config.borderRadius);
        }

        // Text
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
        gridItem: GridItem, 
        config: GameImageConfig
    ): void {
        // Determine color based on categoryIndex
        const colorIndex = gridItem.categoryIndex || 0;
        const backgroundColor = config.groupedBackgroundColors[colorIndex % config.groupedBackgroundColors.length];
        
        // Draw background of category bar with border radius
        this.drawRoundedRect(ctx, x, y, width, height, config.borderRadius, backgroundColor);

        // Border (only if borderWidth > 0)
        if (config.borderWidth > 0) {
            ctx.strokeStyle = config.borderColor;
            ctx.lineWidth = config.borderWidth;
            this.strokeRoundedRect(ctx, x, y, width, height, config.borderRadius);
        }

        // Text (white on colored background)
        ctx.fillStyle = '#ffffff';
        
        // Split text into category name and words
        const textParts = gridItem.text.split('\n');
        const categoryName = textParts[0] || '';
        const words = textParts[1] || '';
        
        // Draw category name with normal font size
        ctx.font = `bold ${config.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const categoryY = y + height / 2 - (words ? config.fontSize / 2 : 0);
        ctx.fillText(categoryName, x + width / 2, categoryY);
        
        // Draw words with half font size
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

    private drawRoundedRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        fillColor: string
    ): void {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    private strokeRoundedRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ): void {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        ctx.stroke();
    }

    private ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            Logger.logInfo(`Created directory: ${dirPath}`);
        }
    }
}

export default new GameImageService();
