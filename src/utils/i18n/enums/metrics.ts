import { LanguageEnumTranslations } from "../../../interfaces/application/i18n";
import { LanguageEnum } from "../../../interfaces/enums/database/LanguageEnum";
import { MetricEnum } from "../../../interfaces/enums/application/MetricEnum";

export const metricTranslations: LanguageEnumTranslations<MetricEnum> = {
    [MetricEnum.ActiveGames]: {
        [LanguageEnum.EN]: "Active Games",
        [LanguageEnum.NL]: "Actieve spellen",
        [LanguageEnum.ES]: "Juegos activos",
        [LanguageEnum.DE]: "Aktive Spiele",
        [LanguageEnum.PT]: "Jogos ativos",
    },
    [MetricEnum.Servers]: {
        [LanguageEnum.EN]: "Servers",
        [LanguageEnum.NL]: "Servers",
        [LanguageEnum.ES]: "Servidores",
        [LanguageEnum.DE]: "Server",
        [LanguageEnum.PT]: "Servidores",
    },
    [MetricEnum.Guilds]: {
        [LanguageEnum.EN]: "Guilds",
        [LanguageEnum.NL]: "Gildes",
        [LanguageEnum.ES]: "Gremios",
        [LanguageEnum.DE]: "Gilden",
        [LanguageEnum.PT]: "Guildas",
    },
    [MetricEnum.Users]: {
        [LanguageEnum.EN]: "Users",
        [LanguageEnum.NL]: "Gebruikers",
        [LanguageEnum.ES]: "Usuarios",
        [LanguageEnum.DE]: "Benutzer",
        [LanguageEnum.PT]: "Usuários",
    },
    [MetricEnum.Points]: {
        [LanguageEnum.EN]: "Points",
        [LanguageEnum.NL]: "Punten",
        [LanguageEnum.ES]: "Puntos",
        [LanguageEnum.DE]: "Punkte",
        [LanguageEnum.PT]: "Pontos",
    },
    [MetricEnum.Events]: {
        [LanguageEnum.EN]: "Events",
        [LanguageEnum.NL]: "Evenementen",
        [LanguageEnum.ES]: "Eventos",
        [LanguageEnum.DE]: "Ereignisse",
        [LanguageEnum.PT]: "Eventos",
    },
    [MetricEnum.Members]: {
        [LanguageEnum.EN]: "Members",
        [LanguageEnum.NL]: "Leden",
        [LanguageEnum.ES]: "Miembros",
        [LanguageEnum.DE]: "Mitglieder",
        [LanguageEnum.PT]: "Membros",
    },
    [MetricEnum.ServerMembers]: {
        [LanguageEnum.EN]: "Server Members",
        [LanguageEnum.NL]: "Serverleden",
        [LanguageEnum.ES]: "Miembros del servidor",
        [LanguageEnum.DE]: "Servermitglieder",
        [LanguageEnum.PT]: "Membros do servidor",
    },
    [MetricEnum.AdoptionRate]: {
        [LanguageEnum.EN]: "Adoption Rate",
        [LanguageEnum.NL]: "Adoptiegraad",
        [LanguageEnum.ES]: "Tasa de adopción",
        [LanguageEnum.DE]: "Adoptionsrate",
        [LanguageEnum.PT]: "Taxa de adoção",
    },
    [MetricEnum.InactivityRate]: {
        [LanguageEnum.EN]: "Inactivity Rate",
        [LanguageEnum.NL]: "Inactiviteitsgraad",
        [LanguageEnum.ES]: "Tasa de inactividad",
        [LanguageEnum.DE]: "Inaktivitätsrate",
        [LanguageEnum.PT]: "Taxa de inatividade",
    },
};
