import { CountryEnum } from '../../interfaces/enums/application/CountryEnum';
import { LanguageEnum } from '../../interfaces/enums/database/LanguageEnum';
import { countryTranslations } from '../i18n/enums/countries';
import { BoundingBox } from '../api/MapillaryClient';

// [minLon, minLat, maxLon, maxLat]. Starter set of common countries, extend as needed.
export const COUNTRY_BOUNDING_BOXES: Partial<Record<CountryEnum, BoundingBox>> = {
    [CountryEnum.UNITED_STATES]: [-125.0, 24.5, -66.9, 49.4],
    [CountryEnum.CANADA]: [-141.0, 41.7, -52.6, 83.1],
    [CountryEnum.MEXICO]: [-117.1, 14.5, -86.7, 32.7],
    [CountryEnum.BRAZIL]: [-73.9, -33.8, -34.8, 5.3],
    [CountryEnum.ARGENTINA]: [-73.6, -55.1, -53.6, -21.8],
    [CountryEnum.UNITED_KINGDOM]: [-8.6, 49.9, 1.8, 60.9],
    [CountryEnum.IRELAND]: [-10.5, 51.4, -6.0, 55.4],
    [CountryEnum.FRANCE]: [-5.1, 41.3, 9.6, 51.1],
    [CountryEnum.GERMANY]: [5.9, 47.3, 15.0, 55.1],
    [CountryEnum.NETHERLANDS]: [3.4, 50.8, 7.2, 53.5],
    [CountryEnum.BELGIUM]: [2.5, 49.5, 6.4, 51.5],
    [CountryEnum.SPAIN]: [-9.3, 36.0, 4.3, 43.8],
    [CountryEnum.PORTUGAL]: [-9.5, 36.9, -6.2, 42.2],
    [CountryEnum.ITALY]: [6.6, 36.6, 18.5, 47.1],
    [CountryEnum.SWITZERLAND]: [5.9, 45.8, 10.5, 47.8],
    [CountryEnum.AUSTRIA]: [9.5, 46.4, 17.2, 49.0],
    [CountryEnum.POLAND]: [14.1, 49.0, 24.2, 54.8],
    [CountryEnum.SWEDEN]: [11.0, 55.3, 24.2, 69.1],
    [CountryEnum.NORWAY]: [4.6, 57.9, 31.1, 71.2],
    [CountryEnum.DENMARK]: [8.1, 54.5, 15.2, 57.8],
    [CountryEnum.FINLAND]: [20.6, 59.8, 31.6, 70.1],
    [CountryEnum.ICELAND]: [-24.5, 63.3, -13.5, 66.6],
    [CountryEnum.GREECE]: [19.4, 34.8, 28.3, 41.8],
    [CountryEnum.TURKEY]: [26.0, 36.0, 44.8, 42.1],
    [CountryEnum.RUSSIA]: [19.6, 41.2, 180.0, 81.9],
    [CountryEnum.UKRAINE]: [22.1, 44.4, 40.2, 52.4],
    [CountryEnum.CZECHIA]: [12.1, 48.6, 18.9, 51.1],
    [CountryEnum.ROMANIA]: [20.3, 43.6, 29.7, 48.3],
    [CountryEnum.HUNGARY]: [16.1, 45.7, 22.9, 48.6],
    [CountryEnum.JAPAN]: [129.4, 31.0, 145.8, 45.6],
    [CountryEnum.CHINA]: [73.5, 18.2, 134.8, 53.6],
    [CountryEnum.SOUTH_KOREA]: [125.9, 33.1, 129.6, 38.6],
    [CountryEnum.INDIA]: [68.2, 6.7, 97.4, 35.5],
    [CountryEnum.THAILAND]: [97.3, 5.6, 105.6, 20.5],
    [CountryEnum.VIETNAM]: [102.1, 8.4, 109.5, 23.4],
    [CountryEnum.INDONESIA]: [95.0, -11.0, 141.0, 6.1],
    [CountryEnum.PHILIPPINES]: [116.9, 4.6, 126.6, 21.1],
    [CountryEnum.MALAYSIA]: [99.6, 0.9, 119.3, 7.4],
    [CountryEnum.AUSTRALIA]: [112.9, -43.7, 153.6, -10.7],
    [CountryEnum.NEW_ZEALAND]: [166.4, -47.3, 178.6, -34.4],
    [CountryEnum.SOUTH_AFRICA]: [16.5, -34.8, 32.9, -22.1],
    [CountryEnum.EGYPT]: [24.7, 22.0, 36.9, 31.7],
    [CountryEnum.MOROCCO]: [-13.2, 27.7, -1.0, 35.9],
    [CountryEnum.KENYA]: [33.9, -4.7, 41.9, 5.5],
    [CountryEnum.NIGERIA]: [2.7, 4.3, 14.7, 13.9],
    [CountryEnum.ISRAEL]: [34.2, 29.5, 35.9, 33.3],
    [CountryEnum.SAUDI_ARABIA]: [34.5, 16.3, 55.7, 32.2],
    [CountryEnum.UNITED_ARAB_EMIRATES]: [51.5, 22.6, 56.4, 26.1],
};

const NAME_TO_COUNTRY: Record<string, CountryEnum> = Object.fromEntries(
    Object.entries(countryTranslations).map(([country, translations]) => [
        (translations as { [LanguageEnum.EN]: string })[LanguageEnum.EN].toLowerCase(),
        Number(country) as CountryEnum,
    ])
);

export function getCountryBoundingBox(countryName: string): BoundingBox | undefined {
    const country = NAME_TO_COUNTRY[countryName.trim().toLowerCase()];
    return country !== undefined ? COUNTRY_BOUNDING_BOXES[country] : undefined;
}
