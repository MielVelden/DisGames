import { GamesCommandActionEnum } from "../../interfaces/enums/commands/Games";
import { ProfileCommandActionEnum } from "../../interfaces/enums/commands/Profile";
import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";
import { MultiLingualString } from "./MultiLingualString";
import { I18nTranslations } from "../../interfaces/application/i18n";
import { GameTypeEnum } from "../../interfaces/enums/database/GameTypeEnum";
import { ExceptionEnum } from "../../interfaces/enums/application/ExpectionEnum";

export const i18n: I18nTranslations = {
    labels: {
        common: {
            success: {
                [LanguageEnum.EN]: "All set",
                [LanguageEnum.NL]: "Klaar",
            },
            cancel: {
                [LanguageEnum.EN]: "Dismiss",
                [LanguageEnum.NL]: "Annuleer",
            },
            accept: {
                [LanguageEnum.EN]: "Accept",
                [LanguageEnum.NL]: "Accepteren",
            },
            deny: {
                [LanguageEnum.EN]: "Deny",
                [LanguageEnum.NL]: "Weigeren",
            },
            cancelled: {
                [LanguageEnum.EN]: "This request has been cancelled",
                [LanguageEnum.NL]: "Dit verzoek is geannuleerd",
            },
            timedOut: {
                [LanguageEnum.EN]: "Something went wrong, please try again",
                [LanguageEnum.NL]: "Er ging iets mis, probeer het opnieuw",
            },
            delete: {
                [LanguageEnum.EN]: "Remove",
                [LanguageEnum.NL]: "Verwijderen",
            },
            askQuestion: {
                [LanguageEnum.EN]: "Please answer the question",
                [LanguageEnum.NL]: "Vul een antwoord in",
            },
        },
        handleNever: (uniqueCase: string, origin: string) => new MultiLingualString({
            [LanguageEnum.EN]: "Unhandled case {uniqueCase} in {origin}",
            [LanguageEnum.NL]: "Niet afgehandelde case {uniqueCase} in {origin}"
        }, { uniqueCase, origin })
    },
    tables: {
        users: {
            singleName: {
                [LanguageEnum.EN]: "User",
                [LanguageEnum.NL]: "Gebruiker",
            },
            multiName: {
                [LanguageEnum.EN]: "Users",
                [LanguageEnum.NL]: "Gebruikers",
            },
            fields: {
                username: {
                    [LanguageEnum.EN]: "Username",
                    [LanguageEnum.NL]: "Gebruikersnaam",
                },
            }
        },
        points: {
            singleName: {
                [LanguageEnum.EN]: "Point",
                [LanguageEnum.NL]: "Punt",
            },
            multiName: {
                [LanguageEnum.EN]: "Points",
                [LanguageEnum.NL]: "Punten",
            }
        },
    },
    commands: {
        debug: {
            description: {
                [LanguageEnum.EN]: "Debug",
                [LanguageEnum.NL]: "Debug",
            },
            labels: {
                title: {
                    [LanguageEnum.EN]: "Debug",
                    [LanguageEnum.NL]: "Debug",
                },
                description: (uniqueCode: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "Please send the following command in any channel in the server that you need help with: 'debug {uniqueCode}'",
                    [LanguageEnum.NL]: "Stuur het volgende commando in een kanaal in de server waar je hulp nodig hebt: 'debug {uniqueCode}'",
                }, { uniqueCode }),
                thanks: {
                    [LanguageEnum.EN]: "Thank you for your help, the developer will be notified and will get back to you as soon as possible.",
                    [LanguageEnum.NL]: "Bedankt voor je hulp, de ontwikkelaar wordt op de hoogte gebracht en zal zo snel mogelijk terugkomen.",
                },
            }
        },
        games: {
            description: {
                [LanguageEnum.EN]: "Easily configure and manage your games",
                [LanguageEnum.NL]: "Beheer en stel je spellen moeiteloos in",
            },
            option: {
                action: {
                    [LanguageEnum.EN]: "Action",
                    [LanguageEnum.NL]: "Actie",
                },
                actionDescription: {
                    [LanguageEnum.EN]: "Select how you’d like to manage your games",
                    [LanguageEnum.NL]: "Kies hoe je je spellen wilt beheren",
                },
                noAction: {
                    [LanguageEnum.EN]: "Please choose an action to continue",
                    [LanguageEnum.NL]: "Selecteer een actie om door te gaan",
                },
                choices: {
                    [GamesCommandActionEnum.MANAGE]: {
                        [LanguageEnum.EN]: "Manage games and settings",
                        [LanguageEnum.NL]: "Spellen en instellingen beheren",
                    },
                    [GamesCommandActionEnum.HELP]: {
                        [LanguageEnum.EN]: "Get help and support",
                        [LanguageEnum.NL]: "Hulp en ondersteuning",
                    },
                    [GamesCommandActionEnum.SETUP]: {
                        [LanguageEnum.EN]: "Set up new games",
                        [LanguageEnum.NL]: "Nieuwe spellen instellen",
                    }
                }
            },
            labels: {
                noActiveGames: {
                    [LanguageEnum.EN]: "No active games",
                    [LanguageEnum.NL]: "Geen actieve spellen",
                },
                success: {
                    [LanguageEnum.EN]: "Game setup complete",
                    [LanguageEnum.NL]: "Spel succesvol ingesteld",
                },
                selectGame: {
                    [LanguageEnum.EN]: "Choose a game",
                    [LanguageEnum.NL]: "Kies een spel",
                },
                deleteSuccess: {
                    [LanguageEnum.EN]: "Game removed",
                    [LanguageEnum.NL]: "Spel verwijderd",
                },
                chooseChannel: {
                    [LanguageEnum.EN]: "Choose a channel",
                    [LanguageEnum.NL]: "Kies een kanaal",
                },
                confirmSetupTitle: {
                    [LanguageEnum.EN]: "Confirm Game Setup",
                    [LanguageEnum.NL]: "Bevestig Spel Instelling",
                },
                confirmSetupDescription: (gameName: string, channelName: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "Game: `{gameName}`\nChannel: `{channelName}`",
                    [LanguageEnum.NL]: "Spel: `{gameName}`\nKanaal: `{channelName}`",
                }, { gameName, channelName }),
                movedToChannel: (channel: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "Moved to {channel}",
                    [LanguageEnum.NL]: "Verplaatst naar {channel}",
                }, { channel }),
                skipAnswer: {
                    [LanguageEnum.EN]: "Not familiar with the word? Enter '?'",
                    [LanguageEnum.NL]: "Niet bekend met het woord? Voer '?' in",
                },
                howToPlay: {
                    [LanguageEnum.EN]: "How to Play",
                    [LanguageEnum.NL]: "Hoe te spelen",
                },
                incorrectAnswer: {
                    [LanguageEnum.EN]: "The answer is incorrect. The counter has been reset to 1.",
                    [LanguageEnum.NL]: "Het antwoord is incorrect. De teller is teruggezet naar 1.",
                },
            },
            settings: {
                title: {
                    [LanguageEnum.EN]: "Game Settings",
                    [LanguageEnum.NL]: "Spelinstellingen",
                },
                description: {
                    [LanguageEnum.EN]: "Configure the settings for this game:",
                    [LanguageEnum.NL]: "Configureer de instellingen voor dit spel:",
                },
                currentSettings: {
                    [LanguageEnum.EN]: "Current Settings",
                    [LanguageEnum.NL]: "Huidige instellingen",
                },
                enabled: {
                    [LanguageEnum.EN]: "Enabled",
                    [LanguageEnum.NL]: "Ingeschakeld",
                },
                disabled: {
                    [LanguageEnum.EN]: "Disabled",
                    [LanguageEnum.NL]: "Uitgeschakeld",
                },
                unknown: {
                    [LanguageEnum.EN]: "Unknown",
                    [LanguageEnum.NL]: "Onbekend",
                },
                gameDescription: {
                    [LanguageEnum.EN]: "Game description",
                    [LanguageEnum.NL]: "Spelbeschrijving",
                },
                currentChannel: {
                    [LanguageEnum.EN]: "Current game channel",
                    [LanguageEnum.NL]: "Huidige spelkanaal",
                },
                resetOnFail: {
                    label: {
                        [LanguageEnum.EN]: "Reset on Wrong Answer",
                        [LanguageEnum.NL]: "Reset bij fout antwoord",
                    },
                    description: {
                        [LanguageEnum.EN]: "When enabled, the count resets to 1 when someone gives a wrong answer",
                        [LanguageEnum.NL]: "Wanneer ingeschakeld, wordt de telling teruggezet naar 1 bij een fout antwoord",
                    },
                },
                difficulty: {
                    label: {
                        [LanguageEnum.EN]: "Difficulty Level",
                        [LanguageEnum.NL]: "Moeilijkheidsgraad",
                    },
                    description: {
                        [LanguageEnum.EN]: "Choose the difficulty level for word scrambling",
                        [LanguageEnum.NL]: "Kies de moeilijkheidsgraad voor woordverwarring",
                    },
                    easy: {
                        [LanguageEnum.EN]: "Easy",
                        [LanguageEnum.NL]: "Makkelijk",
                    },
                    medium: {
                        [LanguageEnum.EN]: "Medium",
                        [LanguageEnum.NL]: "Gemiddeld",
                    },
                    hard: {
                        [LanguageEnum.EN]: "Hard",
                        [LanguageEnum.NL]: "Moeilijk",
                    },
                    easyDescription: {
                        [LanguageEnum.EN]: "Simple words, less scrambling",
                        [LanguageEnum.NL]: "Eenvoudige woorden, minder verwarring",
                    },
                    mediumDescription: {
                        [LanguageEnum.EN]: "Moderate difficulty",
                        [LanguageEnum.NL]: "Gemiddelde moeilijkheid",
                    },
                    hardDescription: {
                        [LanguageEnum.EN]: "Complex words, heavy scrambling",
                        [LanguageEnum.NL]: "Complexe woorden, sterke verwarring",
                    },
                },
                datasheets: {
                    label: {
                        [LanguageEnum.EN]: "Datasheets",
                        [LanguageEnum.NL]: "Datasheets",
                    },
                    description: {
                        [LanguageEnum.EN]: "Choose the datasheets for this game",
                        [LanguageEnum.NL]: "Kies de datasheets voor dit spel",
                    },
                },
            },
            buttons: {
                delete: {
                    [LanguageEnum.EN]: "Are you sure you want to delete this game?",
                    [LanguageEnum.NL]: "Weet je zeker dat je dit spel wilt verwijderen?",
                },
                move: {
                    [LanguageEnum.EN]: "Move Channel",
                    [LanguageEnum.NL]: "Kanaal verplaatsen",
                },
                moveHere: {
                    [LanguageEnum.EN]: "Switch to this channel",
                    [LanguageEnum.NL]: "Overschakelen naar dit kanaal",
                },
            },
            types: {
                [GameTypeEnum.COUNTING]: {
                    name: {
                        [LanguageEnum.EN]: "Counting",
                        [LanguageEnum.NL]: "Tellen",
                    },
                    description: {
                        [LanguageEnum.EN]: "Count incrementally from the starting number",
                        [LanguageEnum.NL]: "Tel vanaf het startnummer op",
                    },
                    longDescription: {
                        [LanguageEnum.EN]: "A simple yet engaging counting game where players take turns adding the next number in sequence. Perfect for keeping your community active and fostering friendly competition.",
                        [LanguageEnum.NL]: "Een eenvoudig maar boeiend telspel waarbij spelers om de beurt het volgende nummer in de reeks toevoegen. Perfect om je gemeenschap actief te houden en vriendschappelijke competitie te bevorderen.",
                    },
                    howToPlay: {
                        [LanguageEnum.EN]: "Players take turns sending the next number in sequence. Start from the given number and count upward. Each player can only send one number at a time, and the sequence must be continuous.",
                        [LanguageEnum.NL]: "Spelers nemen om de beurt het volgende nummer in de reeks. Begin vanaf het gegeven nummer en tel omhoog. Elke speler kan maar één nummer per keer versturen, en de reeks moet doorlopend zijn.",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "Start with {firstAnswer}",
                        [LanguageEnum.NL]: "We beginnen met {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.WORD_SNAKE]: {
                    name: {
                        [LanguageEnum.EN]: "Word Snake",
                        [LanguageEnum.NL]: "Woordslang",
                    },
                    description: {
                        [LanguageEnum.EN]: "Chain words together where each word starts with the last letter",
                        [LanguageEnum.NL]: "Keten woorden aan elkaar waarbij elk woord begint met de laatste letter",
                    },
                    longDescription: {
                        [LanguageEnum.EN]: "Challenge your vocabulary in this clever word-chaining game. Each player must contribute a word that begins with the last letter of the previous word, creating an endless snake of connected words.",
                        [LanguageEnum.NL]: "Daag je vocabulaire uit in dit slimme woordkettingspel. Elke speler moet een woord bijdragen dat begint met de laatste letter van het vorige woord, waardoor een eindeloze slang van verbonden woorden ontstaat.",
                    },
                    howToPlay: {
                        [LanguageEnum.EN]: "Start with the given letter and create a word. The next player must create a word that starts with the last letter of your word. Continue the chain as long as possible. No repeating words!",
                        [LanguageEnum.NL]: "Begin met de gegeven letter en maak een woord. De volgende speler moet een woord maken dat begint met de laatste letter van jouw woord. Ga zo lang mogelijk door met de keten. Geen herhalende woorden!",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First letter: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste letter: {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.ANAGRAM]: {
                    name: {
                        [LanguageEnum.EN]: "Anagram",
                        [LanguageEnum.NL]: "Anagram",
                    },
                    description: {
                        [LanguageEnum.EN]: "Solve scrambled letter puzzles to find the hidden word",
                        [LanguageEnum.NL]: "Los puzzels met gemengde letters op om het verborgen woord te vinden",
                    },
                    longDescription: {
                        [LanguageEnum.EN]: "Test your word skills with scrambled letter puzzles. Rearrange the given letters to discover the hidden word. A perfect brain teaser that challenges your pattern recognition and vocabulary.",
                        [LanguageEnum.NL]: "Test je woordvaardigheden met puzzels van gemengde letters. Herschik de gegeven letters om het verborgen woord te ontdekken. Een perfecte hersenkraker die je patroonherkenning en vocabulaire uitdaagt.",
                    },
                    howToPlay: {
                        [LanguageEnum.EN]: "You'll receive a set of scrambled letters. Rearrange them to form a valid word. Type your answer when you think you've solved it. The faster you solve it, the more points you earn!",
                        [LanguageEnum.NL]: "Je krijgt een set gemengde letters. Herschik ze om een geldig woord te vormen. Typ je antwoord wanneer je denkt dat je het hebt opgelost. Hoe sneller je het oplost, hoe meer punten je verdient!",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First letter: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste letter: {firstAnswer}",
                    }, { firstAnswer }),
                    nextAnswer: (nextAnswer?: string | number) => new MultiLingualString({
                        [LanguageEnum.EN]: "Next word: {nextAnswer}",
                        [LanguageEnum.NL]: "Volgend woord: {nextAnswer}",
                    }, { nextAnswer: nextAnswer || "" }),
                },
                [GameTypeEnum.NUMBER_GUESS]: {
                    name: {
                        [LanguageEnum.EN]: "Number Guess",
                        [LanguageEnum.NL]: "Getal raden",
                    },
                    description: {
                        [LanguageEnum.EN]: "Use clues to discover the secret number",
                        [LanguageEnum.NL]: "Gebruik aanwijzingen om het geheime getal te ontdekken",
                    },
                    longDescription: {
                        [LanguageEnum.EN]: "Put your deductive reasoning to the test in this classic guessing game. Use the clues provided to narrow down and discover the hidden number. A timeless game that sharpens your logical thinking.",
                        [LanguageEnum.NL]: "Zet je deductieve redenering op de proef in dit klassieke raadspel. Gebruik de gegeven aanwijzingen om het verborgen getal te achterhalen. Een tijdloos spel dat je logisch denken scherpt.",
                    },
                    howToPlay: {
                        [LanguageEnum.EN]: "A secret number is chosen within a specific range. Make guesses and receive hints like 'higher' or 'lower' to guide your next attempt. Keep guessing until you find the correct number!",
                        [LanguageEnum.NL]: "Er wordt een geheim getal gekozen binnen een specifiek bereik. Doe gissingen en ontvang hints zoals 'hoger' of 'lager' om je volgende poging te begeleiden. Blijf raden tot je het juiste getal vindt!",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First number: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste getal: {firstAnswer}",
                    }, { firstAnswer }),
                    nextAnswer: (nextAnswer?: string | number) => new MultiLingualString({
                        [LanguageEnum.EN]: "I'm thinking of a number between 1 and {nextAnswer}. Can you guess it?",
                        [LanguageEnum.NL]: "Ik denk aan een getal tussen 1 en {nextAnswer}. Kun je het raden?",
                    }, { nextAnswer: nextAnswer || "" }),
                },
                [GameTypeEnum.TRIVIA_QUIZ]: {
                    name: {
                        [LanguageEnum.EN]: "Trivia Quiz",
                        [LanguageEnum.NL]: "Triviaquiz",
                    },
                    description: {
                        [LanguageEnum.EN]: "Test your knowledge with challenging trivia questions",
                        [LanguageEnum.NL]: "Test je kennis met uitdagende trivia-vragen",
                    },
                    longDescription: {
                        [LanguageEnum.EN]: "Challenge yourself and your friends with an endless variety of trivia questions. From history and science to pop culture and sports, expand your knowledge while having fun with your community.",
                        [LanguageEnum.NL]: "Daag jezelf en je vrienden uit met een eindeloze variatie aan trivia-vragen. Van geschiedenis en wetenschap tot popcultuur en sport, breid je kennis uit terwijl je plezier hebt met je gemeenschap.",
                    },
                    howToPlay: {
                        [LanguageEnum.EN]: "Read each trivia question carefully and submit your answer. Questions cover various topics and difficulty levels. The first person to answer correctly wins the round and earns points.",
                        [LanguageEnum.NL]: "Lees elke trivia-vraag zorgvuldig en verstuur je antwoord. Vragen beslaan verschillende onderwerpen en moeilijkheidsgraden. De eerste persoon die correct antwoordt wint de ronde en verdient punten.",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First question: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste vraag: {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.GUESS_THE_PRICE]: {
                    name: {
                        [LanguageEnum.EN]: "Guess the Price",
                        [LanguageEnum.NL]: "Raad de prijs",
                    },
                    description: {
                        [LanguageEnum.EN]: "Estimate the retail price of everyday items",
                        [LanguageEnum.NL]: "Schat de winkelprijs van alledaagse producten",
                    },
                    longDescription: {
                        [LanguageEnum.EN]: "Put your market knowledge to the test by estimating the prices of various products. From electronics to groceries, see how well you know the value of things around you in this engaging guessing game.",
                        [LanguageEnum.NL]: "Zet je marktkennis op de proef door de prijzen van verschillende producten te schatten. Van elektronica tot boodschappen, kijk hoe goed je de waarde kent van dingen om je heen in dit boeiende raadspel.",
                    },
                    howToPlay: {
                        [LanguageEnum.EN]: "You'll be shown a product with its description. Study it carefully and submit your price estimate. The player with the closest guess without going over wins the round. Currency is usually in local format.",
                        [LanguageEnum.NL]: "Je krijgt een product met bijbehorende beschrijving te zien. Bestudeer het zorgvuldig en verstuur je prijsschatting. De speler met de dichtste gissing zonder over te gaan wint de ronde. Valuta is meestal in lokaal formaat.",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First price: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste prijs: {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.MATH_QUIZ]: {
                    name: {
                        [LanguageEnum.EN]: "Math Quiz",
                        [LanguageEnum.NL]: "Rekenquiz",
                    },
                    description: {
                        [LanguageEnum.EN]: "Sharpen your skills with mathematical challenges",
                        [LanguageEnum.NL]: "Scherp je vaardigheden aan met wiskundige uitdagingen",
                    },
                    longDescription: {
                        [LanguageEnum.EN]: "Exercise your mathematical skills with a variety of problems ranging from basic arithmetic to more complex calculations. Perfect for students and anyone looking to keep their math skills sharp and quick.",
                        [LanguageEnum.NL]: "Train je wiskundige vaardigheden met verschillende problemen, van eenvoudige rekenkunde tot complexere berekeningen. Perfect voor studenten en iedereen die hun rekenvaardigheden scherp en snel wil houden.",
                    },
                    howToPlay: {
                        [LanguageEnum.EN]: "Solve the mathematical equation presented to you. Problems can include addition, subtraction, multiplication, division, and more advanced operations. Submit your numerical answer as quickly as possible for maximum points.",
                        [LanguageEnum.NL]: "Los de wiskundige vergelijking op die aan je wordt voorgelegd. Problemen kunnen optellen, aftrekken, vermenigvuldigen, delen en meer geavanceerde bewerkingen bevatten. Verstuur je numerieke antwoord zo snel mogelijk voor maximale punten.",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First problem: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste opgave: {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.GUESS_THE_FLAG]: {
                    name: {
                        [LanguageEnum.EN]: "Guess the Flag",
                        [LanguageEnum.NL]: "Raad de Vlag",
                    },
                    description: {
                        [LanguageEnum.EN]: "Identify countries by their national flags",
                        [LanguageEnum.NL]: "Herken landen aan hun nationale vlaggen",
                    },
                    longDescription: {
                        [LanguageEnum.EN]: "Explore the world through flags in this educational and entertaining geography game. Test your knowledge of world cultures and expand your understanding of different nations and their symbols.",
                        [LanguageEnum.NL]: "Ontdek de wereld via vlaggen in dit educatieve en vermakelijke aardrijkskundespel. Test je kennis van wereldculturen en breid je begrip uit van verschillende naties en hun symbolen.",
                    },
                    howToPlay: {
                        [LanguageEnum.EN]: "You'll be shown a country's flag and need to identify which nation it represents. Type the country name as your answer. Flags range from well-known to more obscure nations, so sharpen those geography skills!",
                        [LanguageEnum.NL]: "Je krijgt de vlag van een land te zien en moet herkennen welke natie deze vertegenwoordigt. Typ de landnaam als je antwoord. Vlaggen variëren van bekende tot meer obscure landen, dus scherp die aardrijkskundevaardigheden aan!",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "Let’s start, the first flag is: {firstAnswer}",
                        [LanguageEnum.NL]: "We beginnen, de eerste vlag is: {firstAnswer}",
                    }, { firstAnswer }),
                    nextAnswer: (nextAnswer?: string | number) => new MultiLingualString({
                        [LanguageEnum.EN]: "Can you guess the flag?",
                        [LanguageEnum.NL]: "Kun jij de vlag raden?",
                    }),
                    start: () => new MultiLingualString({
                        [LanguageEnum.EN]: "Let’s start, you can start guessing the flag by typing the country name. When you're not sure, you can skip the answer by typing '?'",
                        [LanguageEnum.NL]: "We beginnen, je kan beginnen met raden aan de vlag door de landnaam te typen. Wanneer je niet zeker bent, kan je het antwoord overslaan door '?' te typen",
                    }),
                },
                [GameTypeEnum.CONNECTIONS]: {
                    name: {
                        [LanguageEnum.EN]: "Connections",
                        [LanguageEnum.NL]: "Verbindingen",
                    },
                    description: {
                        [LanguageEnum.EN]: "Find groups of four related words",
                        [LanguageEnum.NL]: "Vind groepen van vier gerelateerde woorden",
                    },
                    longDescription: {
                        [LanguageEnum.EN]: "Challenge your word association skills by identifying groups of four words that share a common theme. Each puzzle contains exactly four categories, and you need to find all connections to complete the game.",
                        [LanguageEnum.NL]: "Daag je woordassociatievaardigheden uit door groepen van vier woorden te identificeren die een gemeenschappelijk thema delen. Elke puzzle bevat precies vier categorieën, en je moet alle verbindingen vinden om het spel te voltooien.",
                    },
                    howToPlay: {
                        [LanguageEnum.EN]: "You'll see 16 words arranged in a grid. Find groups of 4 words that belong together and submit them by typing the 4 words separated by commas or spaces. Each correct group will be highlighted. Find all 4 categories to win!",
                        [LanguageEnum.NL]: "Je ziet 16 woorden in een raster. Vind groepen van 4 woorden die bij elkaar horen en dien ze in door de 4 woorden te typen gescheiden door komma's of spaties. Elke juiste groep wordt gemarkeerd. Vind alle 4 categorieën om te winnen!",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "Find groups of 4 related words. Type 4 words separated by commas to submit a group.",
                        [LanguageEnum.NL]: "Vind groepen van 4 gerelateerde woorden. Typ 4 woorden gescheiden door komma's om een groep in te dienen.",
                    }, { firstAnswer }),
                    start: () => new MultiLingualString({
                        [LanguageEnum.EN]: "🔗 **Connections Game Started!** 🔗\n\nFind groups of 4 words that belong together. Type your guess as: `word1, word2, word3, word4`",
                        [LanguageEnum.NL]: "🔗 **Verbindingen Spel Gestart!** 🔗\n\nVind groepen van 4 woorden die bij elkaar horen. Typ je gok als: `woord1, woord2, woord3, woord4`",
                    }),
                    nextAnswer: (remaining?: string | number) => new MultiLingualString({
                        [LanguageEnum.EN]: `Great! You found a category! ${remaining} categories remaining. Keep looking for groups of 4 related words.`,
                        [LanguageEnum.NL]: `Geweldig! Je hebt een categorie gevonden! Nog ${remaining} categorieën over. Blijf zoeken naar groepen van 4 gerelateerde woorden.`,
                    }),
                    incorrectAnswer: () => new MultiLingualString({
                        [LanguageEnum.EN]: "❌ That's not a valid group. Try again! Remember: you need exactly 4 words that belong to the same category.",
                        [LanguageEnum.NL]: "❌ Dat is geen geldige groep. Probeer opnieuw! Onthoud: je hebt precies 4 woorden nodig die tot dezelfde categorie behoren.",
                    }),
                    gameComplete: () => new MultiLingualString({
                        [LanguageEnum.EN]: "🎉 **Congratulations!** 🎉\n\nYou found all 4 categories! Excellent word association skills!",
                        [LanguageEnum.NL]: "🎉 **Gefeliciteerd!** 🎉\n\nJe hebt alle 4 categorieën gevonden! Uitstekende woordassociatievaardigheden!",
                    }),
                },
            },
            event: {
                messageChanged: (user: string, message: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "{user}: {message}",
                    [LanguageEnum.NL]: "{user}: {message}",
                }, { user, message }),
            },
        },
        profile: {
            description: {
                [LanguageEnum.EN]: "Manage your profile",
                [LanguageEnum.NL]: "Beheer je profiel",
            },
            option: {
                choices: {
                    [ProfileCommandActionEnum.VIEW]: {
                        [LanguageEnum.EN]: "View",
                        [LanguageEnum.NL]: "Bekijk",
                    },
                    [ProfileCommandActionEnum.MANAGE]: {
                        [LanguageEnum.EN]: "Manage",
                        [LanguageEnum.NL]: "Beheer",
                    },
                },
                action: {
                    [LanguageEnum.EN]: "Action",
                    [LanguageEnum.NL]: "Actie",
                },
                actionDescription: {
                    [LanguageEnum.EN]: "What do you want to do?",
                    [LanguageEnum.NL]: "Wat wil je doen?",
                },
                noAction: {
                    [LanguageEnum.EN]: "No action",
                    [LanguageEnum.NL]: "Geen actie",
                },
            },
            labels: {
                title: {
                    [LanguageEnum.EN]: "Profile",
                    [LanguageEnum.NL]: "Profiel",
                },
                position: {
                    [LanguageEnum.EN]: "Position",
                    [LanguageEnum.NL]: "Positie",
                },
                notRanked: {
                    [LanguageEnum.EN]: "Not ranked yet",
                    [LanguageEnum.NL]: "Nog niet gerankt",
                },
                globalUserRank: {
                    [LanguageEnum.EN]: "Global User Rank",
                    [LanguageEnum.NL]: "Globale Gebruikersrang",
                },
                globalPoints: {
                    [LanguageEnum.EN]: "Global Points",
                    [LanguageEnum.NL]: "Globale Punten",
                },
            }
        },
        settings: {
            description: {
                [LanguageEnum.EN]: "Manage the settings for the bot",
                [LanguageEnum.NL]: "Beheer de instellingen voor de bot",
            },
            labels: {
                title: {
                    [LanguageEnum.EN]: "Settings",
                    [LanguageEnum.NL]: "Instellingen",
                },
                description: {
                    [LanguageEnum.EN]: "Manage the settings for the bot",
                    [LanguageEnum.NL]: "Beheer de instellingen voor de bot",
                },
                changeLanguage: {
                    [LanguageEnum.EN]: "Change Language",
                    [LanguageEnum.NL]: "Taal wijzigen",
                },
                languageChanged: {
                    [LanguageEnum.EN]: "Language changed successfully",
                    [LanguageEnum.NL]: "Taal succesvol gewijzigd",
                },
                clickHereToChangeLanguage: {
                    [LanguageEnum.EN]: "Click here to change language",
                    [LanguageEnum.NL]: "Klik hier om de taal te wijzigen",
                },
            },
        },
        impersonate: {
            description: {
                [LanguageEnum.EN]: "Impersonate another user",
                [LanguageEnum.NL]: "Impersonate een andere gebruiker",
            },
        },
        restartGame: {
            description: {
                [LanguageEnum.EN]: "Restart the game",
                [LanguageEnum.NL]: "Het spel opnieuw starten",
            },
        },
    },
    exceptions: {
        [ExceptionEnum.GAME_ALREADY_EXISTS]: {
            [LanguageEnum.EN]: "This game already exists",
            [LanguageEnum.NL]: "Dit spel bestaat al",
        },
        [ExceptionEnum.CHANNEL_OR_SERVER_NOT_FOUND]: {
            [LanguageEnum.EN]: "We couldn't find the channel or server",
            [LanguageEnum.NL]: "Kanaal of server niet gevonden",
        },
        [ExceptionEnum.ANSWER_ALREADY_EXISTS]: {
            [LanguageEnum.EN]: "You've already submitted an answer",
            [LanguageEnum.NL]: "Je hebt al een antwoord gegeven",
        },
        [ExceptionEnum.INVALID_GAME_TYPE]: {
            [LanguageEnum.EN]: "This game type isn't supported",
            [LanguageEnum.NL]: "Dit speltype wordt niet ondersteund",
        },
        [ExceptionEnum.WANT_TO_REPLACE_CHANNEL]: {
            [LanguageEnum.EN]: "This channel is already set up. Do you want to replace it?",
            [LanguageEnum.NL]: "Dit kanaal is al ingesteld. Wil je het vervangen?",
        },
        [ExceptionEnum.WANT_TO_REPLACE_GAME]: {
            [LanguageEnum.EN]: "This game is already active. Do you want to replace it?",
            [LanguageEnum.NL]: "Dit spel is al actief. Wil je het vervangen?",
        },
        [ExceptionEnum.GAME_MODULE_NOT_FOUND]: {
            [LanguageEnum.EN]: "Game module couldn't be found",
            [LanguageEnum.NL]: "Spelmodule niet gevonden",
        },
        [ExceptionEnum.SAME_USER_ALREADY_ANSWERED]: {
            [LanguageEnum.EN]: "You've already answered",
            [LanguageEnum.NL]: "Je hebt al een antwoord gegeven",
        },
        [ExceptionEnum.WRONG_ANSWER]: {
            [LanguageEnum.EN]: "That's not the correct answer",
            [LanguageEnum.NL]: "Dat is niet het juiste antwoord",
        },
        [ExceptionEnum.GAME_NOT_ACTIVE]: {
            [LanguageEnum.EN]: "The game isn't active right now",
            [LanguageEnum.NL]: "Het spel is momenteel niet actief",
        },
        [ExceptionEnum.MESSAGE_CHANGE_DISABLED]: {
            [LanguageEnum.EN]: "Editing messages is turned off",
            [LanguageEnum.NL]: "Berichten bewerken is uitgeschakeld",
        },
        [ExceptionEnum.INVALID_NUMBER]: {
            [LanguageEnum.EN]: "That doesn't seem to be a valid number",
            [LanguageEnum.NL]: "Dat lijkt geen geldig nummer te zijn",
        },
        [ExceptionEnum.GAME_NOT_FOUND]: {
            [LanguageEnum.EN]: "Game not found",
            [LanguageEnum.NL]: "Spel niet gevonden",
        },
        [ExceptionEnum.SETTING_REQUIRED]: {
            [LanguageEnum.EN]: "This setting is required",
            [LanguageEnum.NL]: "Deze instelling is verplicht",
        },
        [ExceptionEnum.SETTING_INVALID_TYPE]: {
            [LanguageEnum.EN]: "Invalid value type for this setting",
            [LanguageEnum.NL]: "Ongeldig waardetype voor deze instelling",
        },
        [ExceptionEnum.SETTING_INVALID_VALUE]: {
            [LanguageEnum.EN]: "Invalid value for this setting",
            [LanguageEnum.NL]: "Ongeldige waarde voor deze instelling",
        },
        [ExceptionEnum.RECORD_NOT_FOUND]: {
            [LanguageEnum.EN]: "Record not found",
            [LanguageEnum.NL]: "Record niet gevonden",
        },
        [ExceptionEnum.USER_NOT_FOUND]: {
            [LanguageEnum.EN]: "User not found",
            [LanguageEnum.NL]: "Gebruiker niet gevonden",
        },
        [ExceptionEnum.SERVER_NOT_FOUND]: {
            [LanguageEnum.EN]: "Server not found",
            [LanguageEnum.NL]: "Server niet gevonden",
        },
        [ExceptionEnum.RECORD_ALREADY_EXISTS]: {
            [LanguageEnum.EN]: "Record already exists",
            [LanguageEnum.NL]: "Record bestaat al",
        },
        [ExceptionEnum.GAME_CHANNEL_NOT_FOUND]: {
            [LanguageEnum.EN]: "Game channel not found",
            [LanguageEnum.NL]: "Spelkanaal niet gevonden",
        },
        [ExceptionEnum.UNAUTHORIZED]: {
            [LanguageEnum.EN]: "Unauthorized",
            [LanguageEnum.NL]: "Niet geautoriseerd",
        },
        [ExceptionEnum.METHOD_NOT_IMPLEMENTED]: {
            [LanguageEnum.EN]: "Method not implemented",
            [LanguageEnum.NL]: "Methode niet geïmplementeerd",
        },
        [ExceptionEnum.DATABASE_CONNECTION_FAILED]: {
            [LanguageEnum.EN]: "Database connection failed",
            [LanguageEnum.NL]: "Database verbinding mislukt",
        },
        [ExceptionEnum.TABLE_ENUM_NOT_FOUND]: {
            [LanguageEnum.EN]: "Table enum {tableEnumValue} not found",
            [LanguageEnum.NL]: "Tabelenum {tableEnumValue} niet gevonden",
        },
        [ExceptionEnum.ENV_VARIABLE_NOT_SET]: {
            [LanguageEnum.EN]: "Environment variable {environmentVariable} is not set",
            [LanguageEnum.NL]: "Omgevingsvariabele {environmentVariable} is niet ingesteld",
        },
        [ExceptionEnum.FUNCTION_RETURNED_INVALID_RESULT]: {
            [LanguageEnum.EN]: "Function {functionName} returned an invalid result",
            [LanguageEnum.NL]: "Functie {functionName} heeft een ongeldig resultaat teruggegeven",
        },
        [ExceptionEnum.JOB_NOT_FOUND]: {
            [LanguageEnum.EN]: "Job with id {jobId} not found",
            [LanguageEnum.NL]: "Taak met id {jobId} niet gevonden",
        },
        [ExceptionEnum.JOB_FAILED]: {
            [LanguageEnum.EN]: "Job failed",
            [LanguageEnum.NL]: "Taak mislukt",
        },
        [ExceptionEnum.CLIENT_NOT_FOUND]: {
            [LanguageEnum.EN]: "Client with id {clientId} not found",
            [LanguageEnum.NL]: "Client met id {clientId} niet gevonden",
        },
        [ExceptionEnum.COMMAND_REGISTRATION_FAILED]: {
            [LanguageEnum.EN]: "Failed to register commands",
            [LanguageEnum.NL]: "Commands kunnen niet worden geregistreerd",
        },
        [ExceptionEnum.DISCORD_GUILD_NOT_FOUND]: {
            [LanguageEnum.EN]: "Discord guild not found",
            [LanguageEnum.NL]: "Discord server niet gevonden",
        },
        [ExceptionEnum.DISCORD_CHANNEL_NOT_FOUND]: {
            [LanguageEnum.EN]: "Discord channel not found",
            [LanguageEnum.NL]: "Discord kanaal niet gevonden",
        },
        [ExceptionEnum.JSON_INTERFACE_VALIDATION_FAILED]: {
            [LanguageEnum.EN]: "JSON interface validation failed",
            [LanguageEnum.NL]: "JSON interface validatie mislukt",
        },
        [ExceptionEnum.GAME_IMAGE_GENERATION_FAILED]: {
            [LanguageEnum.EN]: "Game image generation failed",
            [LanguageEnum.NL]: "Spelafbeelding generatie mislukt",
        },
        [ExceptionEnum.GAME_STATE_NOT_VALID]: {
            [LanguageEnum.EN]: "Game state is not valid",
            [LanguageEnum.NL]: "Spelstatus is ongeldig",
        },
        [ExceptionEnum.NO_NEXT_ANSWER_FOUND]: {
            [LanguageEnum.EN]: "No next answer found",
            [LanguageEnum.NL]: "Geen volgende antwoord gevonden",
        },
        [ExceptionEnum.SAVE_FAILED]: {
            [LanguageEnum.EN]: "Save failed",
            [LanguageEnum.NL]: "Opslaan mislukt",
        },
        [ExceptionEnum.USER_GAME_POINTS_NOT_FOUND]: {
            [LanguageEnum.EN]: "User game points not found",
            [LanguageEnum.NL]: "Gebruikerspelpunten niet gevonden",
        },
        [ExceptionEnum.INVALID_ARGUMENT]: {
            [LanguageEnum.EN]: "Invalid argument",
            [LanguageEnum.NL]: "Ongeldig argument",
        },
        [ExceptionEnum.FIELD_IS_NULL]: {
            [LanguageEnum.EN]: "Field cannot be null",
            [LanguageEnum.NL]: "Veld mag niet null zijn",
        },
        [ExceptionEnum.FIELD_HAS_CHANGED]: {
            [LanguageEnum.EN]: "Field has changed",
            [LanguageEnum.NL]: "Veld is gewijzigd",
        },
        [ExceptionEnum.FIELD_IS_MISSING_AND_REQUIRED]: {
            [LanguageEnum.EN]: "Field {key} is missing and required",
            [LanguageEnum.NL]: "Veld {key} is ontbrekend en verplicht",
        },
        [ExceptionEnum.FIELD_HAS_INVALID_TYPE]: {
            [LanguageEnum.EN]: "Field {key} has type {received}, but expected {expected}.",
            [LanguageEnum.NL]: "Veld {key} heeft type {received}, maar verwachtte {expected}.",
        },
        [ExceptionEnum.FIELD_HAS_INVALID_VALUE]: {
            [LanguageEnum.EN]: "Field {key} has an invalid value",
            [LanguageEnum.NL]: "Veld {key} heeft een ongeldige waarde",
        },
        [ExceptionEnum.TABLE_NOT_FOUND]: {
            [LanguageEnum.EN]: "Table {tableName} not found",
            [LanguageEnum.NL]: "Tabel {tableName} niet gevonden",
        },
        [ExceptionEnum.ANSWER_SKIPPED]: {
            [LanguageEnum.EN]: "Answer skipped",
            [LanguageEnum.NL]: "Antwoord overslagen",
        },
    },
    languages: {
        [LanguageEnum.EN]: {
            [LanguageEnum.EN]: "English",
            [LanguageEnum.NL]: "Engels"
        },
        [LanguageEnum.NL]: {
            [LanguageEnum.EN]: "Dutch",
            [LanguageEnum.NL]: "Nederlands"
        },
        [LanguageEnum.ES]: {
            [LanguageEnum.EN]: "Spanish",
            [LanguageEnum.NL]: "Spaans"
        },
        [LanguageEnum.DE]: {
            [LanguageEnum.EN]: "German",
            [LanguageEnum.NL]: "Duits"
        },
    },
};

// Export the types for use in other files
export type { LanguageEnumTranslations, LanguageCommandOptionTranslations } from "../../interfaces/application/i18n";
