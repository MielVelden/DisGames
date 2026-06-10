import { BadgeEnum } from "../../../interfaces/enums/application/BadgeEnum";
import { LanguageBadgeTranslations } from "../../../interfaces/application/i18n";
import { LanguageEnum } from "../../../interfaces/enums/database/LanguageEnum";
import { MultiLingualString } from "../MultiLingualString";

export const badgeTranslations: LanguageBadgeTranslations = {
    [BadgeEnum.FIRST_GAME]: {
        title: {
            [LanguageEnum.EN]: "First Game",
            [LanguageEnum.NL]: "Eerste Spel",
            [LanguageEnum.ES]: "Primer Juego",
            [LanguageEnum.DE]: "Erstes Spiel",
            [LanguageEnum.PT]: "Primeiro Jogo",
        },
        description: {
            [LanguageEnum.EN]: "Play your first game",
            [LanguageEnum.NL]: "Speel je eerste spel",
            [LanguageEnum.ES]: "Juega tu primer juego",
            [LanguageEnum.DE]: "Spiele dein erstes Spiel",
            [LanguageEnum.PT]: "Jogue seu primeiro jogo",
        },
    },
    [BadgeEnum.DAY_STREAK]: {
        title: ({ days }) => new MultiLingualString({
            [LanguageEnum.EN]: "{days} Days Streak",
            [LanguageEnum.NL]: "{days} Dagen Op Rij",
            [LanguageEnum.ES]: "Racha de {days} Días",
            [LanguageEnum.DE]: "{days} Tage in Folge",
            [LanguageEnum.PT]: "Sequência de {days} Dias",
        }, { days }),
        description: ({ days }) => new MultiLingualString({
            [LanguageEnum.EN]: "Play at least one game every day for {days} days in a row",
            [LanguageEnum.NL]: "Speel minstens één spel elke dag gedurende {days} dagen achter elkaar",
            [LanguageEnum.ES]: "Juega al menos un juego cada día durante {days} días seguidos",
            [LanguageEnum.DE]: "Spiele mindestens ein Spiel jeden Tag für {days} Tage in Folge",
            [LanguageEnum.PT]: "Jogue pelo menos um jogo todos os dias durante {days} dias seguidos",
        }, { days }),
    },
    [BadgeEnum.GAMES_PLAYED]: {
        title: ({ count }) => new MultiLingualString({
            [LanguageEnum.EN]: "{count} Games Played",
            [LanguageEnum.NL]: "{count} Gespeelde Spellen",
            [LanguageEnum.ES]: "{count} Juegos Jugados",
            [LanguageEnum.DE]: "{count} Gespielte Spiele",
            [LanguageEnum.PT]: "{count} Jogos Jogados",
        }, { count }),
        description: ({ count }) => new MultiLingualString({
            [LanguageEnum.EN]: "Play {count} games",
            [LanguageEnum.NL]: "Speel {count} spellen",
            [LanguageEnum.ES]: "Juega {count} juegos",
            [LanguageEnum.DE]: "Spiele {count} Spiele",
            [LanguageEnum.PT]: "Jogue {count} jogos",
        }, { count }),
    },
    [BadgeEnum.POINT_COLLECTOR]: {
        title: ({ points }) => new MultiLingualString({
            [LanguageEnum.EN]: "{points} Points",
            [LanguageEnum.NL]: "{points} Punten",
            [LanguageEnum.ES]: "{points} Puntos",
            [LanguageEnum.DE]: "{points} Punkte",
            [LanguageEnum.PT]: "{points} Pontos",
        }, { points }),
        description: ({ points }) => new MultiLingualString({
            [LanguageEnum.EN]: "Earn {points} total points",
            [LanguageEnum.NL]: "Verdien {points} totale punten",
            [LanguageEnum.ES]: "Gana {points} puntos en total",
            [LanguageEnum.DE]: "Verdiene {points} Gesamtpunkte",
            [LanguageEnum.PT]: "Ganhe {points} pontos no total",
        }, { points }),
    },
    [BadgeEnum.VETERAN]: {
        title: ({ days }) => new MultiLingualString({
            [LanguageEnum.EN]: "{days} Days",
            [LanguageEnum.NL]: "{days} Dagen",
            [LanguageEnum.ES]: "{days} Días",
            [LanguageEnum.DE]: "{days} Tage",
            [LanguageEnum.PT]: "{days} Dias",
        }, { days }),
        description: ({ days }) => new MultiLingualString({
            [LanguageEnum.EN]: "Have an account for {days} days",
            [LanguageEnum.NL]: "Heb een account van {days} dagen",
            [LanguageEnum.ES]: "Tener una cuenta por {days} días",
            [LanguageEnum.DE]: "Habe ein Konto seit {days} Tagen",
            [LanguageEnum.PT]: "Tenha uma conta por {days} dias",
        }, { days }),
    },
    [BadgeEnum.WORLD_TRAVELER]: {
        title: ({ servers }) => new MultiLingualString({
            [LanguageEnum.EN]: "{servers} Servers",
            [LanguageEnum.NL]: "{servers} Servers",
            [LanguageEnum.ES]: "{servers} Servidores",
            [LanguageEnum.DE]: "{servers} Server",
            [LanguageEnum.PT]: "{servers} Servidores",
        }, { servers }),
        description: ({ servers }) => new MultiLingualString({
            [LanguageEnum.EN]: "Play in {servers} different servers",
            [LanguageEnum.NL]: "Speel op {servers} verschillende servers",
            [LanguageEnum.ES]: "Juega en {servers} servidores diferentes",
            [LanguageEnum.DE]: "Spiele auf {servers} verschiedenen Servern",
            [LanguageEnum.PT]: "Jogue em {servers} servidores diferentes",
        }, { servers }),
    },
};
