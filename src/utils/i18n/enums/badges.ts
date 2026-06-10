import { BadgeEnum } from "../../../interfaces/enums/application/BadgeEnum";
import { LanguageAchievementEnumTranslations } from "../../../interfaces/application/i18n";
import { LanguageEnum } from "../../../interfaces/enums/database/LanguageEnum";

export const badgeTranslations: LanguageAchievementEnumTranslations<BadgeEnum> = {
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
        title: {
            [LanguageEnum.EN]: "7 Days Streak",
            [LanguageEnum.NL]: "7 Dagen Op Rij",
            [LanguageEnum.ES]: "Racha de 7 Días",
            [LanguageEnum.DE]: "7 Tage in Folge",
            [LanguageEnum.PT]: "Sequência de 7 Dias",
        },
        description: {
            [LanguageEnum.EN]: "Play at least one game every day for 7 days in a row",
            [LanguageEnum.NL]: "Speel minstens één spel elke dag gedurende 7 dagen achter elkaar",
            [LanguageEnum.ES]: "Juega al menos un juego cada día durante 7 días seguidos",
            [LanguageEnum.DE]: "Spiele mindestens ein Spiel jeden Tag für 7 Tage in Folge",
            [LanguageEnum.PT]: "Jogue pelo menos um jogo todos os dias durante 7 dias seguidos",
        },
    },
    [BadgeEnum.GAMES_PLAYED]: {
        title: {
            [LanguageEnum.EN]: "Games Played",
            [LanguageEnum.NL]: "Gespeelde Spellen",
            [LanguageEnum.ES]: "Juegos Jugados",
            [LanguageEnum.DE]: "Gespielte Spiele",
            [LanguageEnum.PT]: "Jogos Jogados",
        },
        description: {
            [LanguageEnum.EN]: "Play 10, 50 or 250 games",
            [LanguageEnum.NL]: "Speel 10, 50 of 250 spellen",
            [LanguageEnum.ES]: "Juega 10, 50 o 250 juegos",
            [LanguageEnum.DE]: "Spiele 10, 50 oder 250 Spiele",
            [LanguageEnum.PT]: "Jogue 10, 50 ou 250 jogos",
        },
    },
    [BadgeEnum.POINT_COLLECTOR]: {
        title: {
            [LanguageEnum.EN]: "Point Collector",
            [LanguageEnum.NL]: "Puntenverzamelaar",
            [LanguageEnum.ES]: "Coleccionista de Puntos",
            [LanguageEnum.DE]: "Punktesammler",
            [LanguageEnum.PT]: "Colecionador de Pontos",
        },
        description: {
            [LanguageEnum.EN]: "Earn 500, 5.000 or 50.000 total points",
            [LanguageEnum.NL]: "Verdien 500, 5.000 of 50.000 totale punten",
            [LanguageEnum.ES]: "Gana 500, 5.000 o 50.000 puntos en total",
            [LanguageEnum.DE]: "Verdiene 500, 5.000 oder 50.000 Gesamtpunkte",
            [LanguageEnum.PT]: "Ganhe 500, 5.000 ou 50.000 pontos no total",
        },
    },
    [BadgeEnum.VETERAN]: {
        title: {
            [LanguageEnum.EN]: "Veteran",
            [LanguageEnum.NL]: "Veteraan",
            [LanguageEnum.ES]: "Veterano",
            [LanguageEnum.DE]: "Veteran",
            [LanguageEnum.PT]: "Veterano",
        },
        description: {
            [LanguageEnum.EN]: "Have an account for 100, 200 or 500 days",
            [LanguageEnum.NL]: "Heb een account van 100, 200 of 500 dagen",
            [LanguageEnum.ES]: "Tener una cuenta por 100, 200 o 500 días",
            [LanguageEnum.DE]: "Habe ein Konto seit 100, 200 oder 500 Tagen",
            [LanguageEnum.PT]: "Tenha uma conta por 100, 200 ou 500 dias",
        },
    },
    [BadgeEnum.WORLD_TRAVELER]: {
        title: {
            [LanguageEnum.EN]: "World Traveler",
            [LanguageEnum.NL]: "Wereldreiziger",
            [LanguageEnum.ES]: "Viajero del Mundo",
            [LanguageEnum.DE]: "Weltreisender",
            [LanguageEnum.PT]: "Viajante Mundial",
        },
        description: {
            [LanguageEnum.EN]: "Play in 5, 10 or 20 different servers",
            [LanguageEnum.NL]: "Speel op 5, 10 of 20 verschillende servers",
            [LanguageEnum.ES]: "Juega en 5, 10 o 20 servidores diferentes",
            [LanguageEnum.DE]: "Spiele auf 5, 10 oder 20 verschiedenen Servern",
            [LanguageEnum.PT]: "Jogue em 5, 10 ou 20 servidores diferentes",
        },
    },
};
