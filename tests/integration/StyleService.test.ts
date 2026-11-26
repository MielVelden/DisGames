import AssertionHelpers from '../helpers/AssertionHelpers';
import TestRunner from '../TestRunner';
import { TestSuite } from '../interfaces/TestRunnerInterface';
import StyleService from '../../src/services/domain/StyleService';
import { ServersModel } from '../../src/interfaces/database/TableInterfaces';
import OverrideService from '../../src/services/application/OverrideService';
import { OverrideKeyEnum } from '../../src/interfaces/enums/application/OverrideKeyEnum';
import { LanguageEnum, StyleIdEnum } from '../../src/interfaces/enums';
import { easterSunday, lunarNewYear, thanksgiving } from '../../src/utils/helpers/HolidayDates';

const server = (language: LanguageEnum, extra: Partial<ServersModel> = {}): ServersModel => new ServersModel({ Id: 1, LanguageEnum: language, ...extra });
const day = (month: number, date: number, year: number = 2026): Date => new Date(Date.UTC(year, month - 1, date, 12));

export default function registerStyleServiceTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'Style Service',
        description: 'Seasonal style preset resolution (date windows + language gating)',

        setup: async () => {
            if (StyleService.getPresets().length === 0)
                await StyleService.initAsync();
        },

        tests: [
            {
                name: 'loads the shipped presets',
                testFunction: async () => {
                    const ids = StyleService.getPresets().map(p => p.id);
                    for (const id of Object.values(StyleIdEnum))
                        AssertionHelpers.assertTrue(ids.includes(id), `preset ${id} should load`);
                }
            },
            {
                name: 'resolves no style outside every window',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(6, 15)).presetId, null);
                }
            },
            {
                name: 'Christmas window wraps New Year',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(12, 25)).presetId, StyleIdEnum.CHRISTMAS);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(1, 2)).presetId, StyleIdEnum.CHRISTMAS);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(1, 3)).presetId, null);
                }
            },
            {
                name: 'Sinterklaas only applies to Dutch servers',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.NL), day(11, 20)).presetId, StyleIdEnum.SINTERKLAAS);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(11, 20)).presetId, null);
                }
            },
            {
                name: 'moving holiday dates are computed correctly',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(JSON.stringify(easterSunday(2026)), JSON.stringify({ month: 4, day: 5 }));
                    AssertionHelpers.assertEqual(JSON.stringify(easterSunday(2027)), JSON.stringify({ month: 3, day: 28 }));
                    AssertionHelpers.assertEqual(JSON.stringify(easterSunday(2038)), JSON.stringify({ month: 4, day: 25 }));
                    AssertionHelpers.assertEqual(JSON.stringify(thanksgiving(2026)), JSON.stringify({ month: 11, day: 26 }));
                    AssertionHelpers.assertEqual(JSON.stringify(thanksgiving(2027)), JSON.stringify({ month: 11, day: 25 }));
                    AssertionHelpers.assertEqual(JSON.stringify(lunarNewYear(2027)), JSON.stringify({ month: 2, day: 6 }));
                    AssertionHelpers.assertEqual(lunarNewYear(2099), undefined);
                }
            },
            {
                name: 'Thanksgiving is English-only, Black Friday is everywhere',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(11, 26)).presetId, StyleIdEnum.THANKSGIVING);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.DE), day(11, 26)).presetId, null);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(11, 27)).presetId, StyleIdEnum.BLACK_FRIDAY);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.DE), day(11, 30)).presetId, StyleIdEnum.BLACK_FRIDAY);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.DE), day(12, 1)).presetId, null);
                    // Sinterklaas (cultural) still wins on Dutch servers
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.NL), day(11, 27)).presetId, StyleIdEnum.SINTERKLAAS);
                }
            },
            {
                name: "New Year's Eve beats Christmas, which resumes on 2 January",
                testFunction: async () => {
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(12, 30)).presetId, StyleIdEnum.CHRISTMAS);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(12, 31)).presetId, StyleIdEnum.NEW_YEARS_EVE);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(1, 1, 2027)).presetId, StyleIdEnum.NEW_YEARS_EVE);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(1, 2, 2027)).presetId, StyleIdEnum.CHRISTMAS);
                }
            },
            {
                name: 'February 2027: Lunar New Year, Carnival (Dutch only), Valentine',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(2, 6, 2027)).presetId, StyleIdEnum.LUNAR_NEW_YEAR);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.NL), day(2, 8, 2027)).presetId, StyleIdEnum.CARNIVAL);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(2, 8, 2027)).presetId, StyleIdEnum.LUNAR_NEW_YEAR);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.NL), day(2, 10, 2027)).presetId, null);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.ES), day(2, 14, 2027)).presetId, StyleIdEnum.VALENTINES_DAY);
                }
            },
            {
                name: "St. Patrick's Day (English) and Easter weekend",
                testFunction: async () => {
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(3, 17, 2027)).presetId, StyleIdEnum.ST_PATRICKS_DAY);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.NL), day(3, 17, 2027)).presetId, null);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.NL), day(3, 25, 2027)).presetId, null);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.NL), day(3, 26, 2027)).presetId, StyleIdEnum.EASTER);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.DE), day(3, 29, 2027)).presetId, StyleIdEnum.EASTER);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.DE), day(3, 30, 2027)).presetId, null);
                }
            },
            {
                name: 'forced style override beats date and language gating, and resets',
                testFunction: async () => {
                    OverrideService.set(OverrideKeyEnum.STYLE, 1, StyleIdEnum.SINTERKLAAS);
                    try {
                        const style = StyleService.resolve(server(LanguageEnum.EN), day(6, 15));
                        AssertionHelpers.assertEqual(style.presetId, StyleIdEnum.SINTERKLAAS);
                    } finally {
                        OverrideService.clear(OverrideKeyEnum.STYLE, 1);
                    }
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(6, 15)).presetId, null);
                }
            },
            {
                name: 'override only affects the server it was set for',
                testFunction: async () => {
                    OverrideService.set(OverrideKeyEnum.STYLE, 1, StyleIdEnum.CHRISTMAS);
                    try {
                        AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(6, 15)).presetId, StyleIdEnum.CHRISTMAS);
                        AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN, { Id: 2 }), day(6, 15)).presetId, null);
                    } finally {
                        OverrideService.clear(OverrideKeyEnum.STYLE, 1);
                    }
                }
            },
            {
                name: 'stylesDisabled disables styles, even a forced one; default is on',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN, { Settings: {} }), day(12, 25)).presetId, StyleIdEnum.CHRISTMAS);
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN, { Settings: { stylesDisabled: true } }), day(12, 25)).presetId, null);
                    OverrideService.set(OverrideKeyEnum.STYLE, 1, StyleIdEnum.CHRISTMAS);
                    try {
                        AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN, { Settings: { stylesDisabled: true } }), day(6, 15)).presetId, null);
                    } finally {
                        OverrideService.clear(OverrideKeyEnum.STYLE, 1);
                    }
                }
            },
        ]
    };

    runner.addSuite(suite);
}
