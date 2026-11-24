import AssertionHelpers from '../helpers/AssertionHelpers';
import TestRunner from '../TestRunner';
import { TestSuite } from '../interfaces/TestRunnerInterface';
import StyleService from '../../src/services/domain/StyleService';
import { ServersModel } from '../../src/interfaces/database/TableInterfaces';
import OverrideService from '../../src/services/application/OverrideService';
import { OverrideKeyEnum } from '../../src/interfaces/enums/application/OverrideKeyEnum';
import { LanguageEnum } from '../../src/interfaces/enums';

const server = (language: LanguageEnum, extra: Partial<ServersModel> = {}): ServersModel => new ServersModel({ Id: 1, LanguageEnum: language, ...extra });
const day = (month: number, date: number): Date => new Date(Date.UTC(2026, month - 1, date, 12));

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
                    for (const id of ['christmas', 'halloween', 'sinterklaas'])
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
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(12, 25)).presetId, 'christmas');
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(1, 1)).presetId, 'christmas');
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(1, 3)).presetId, null);
                }
            },
            {
                name: 'Sinterklaas only applies to Dutch servers',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.NL), day(11, 28)).presetId, 'sinterklaas');
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(11, 28)).presetId, null);
                }
            },
            {
                name: 'forced style override beats date and language gating, and resets',
                testFunction: async () => {
                    OverrideService.set(OverrideKeyEnum.STYLE, 1, 'sinterklaas');
                    try {
                        const style = StyleService.resolve(server(LanguageEnum.EN), day(6, 15));
                        AssertionHelpers.assertEqual(style.presetId, 'sinterklaas');
                    } finally {
                        OverrideService.clear(OverrideKeyEnum.STYLE, 1);
                    }
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(6, 15)).presetId, null);
                }
            },
            {
                name: 'override only affects the server it was set for',
                testFunction: async () => {
                    OverrideService.set(OverrideKeyEnum.STYLE, 1, 'christmas');
                    try {
                        AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN), day(6, 15)).presetId, 'christmas');
                        AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN, { Id: 2 }), day(6, 15)).presetId, null);
                    } finally {
                        OverrideService.clear(OverrideKeyEnum.STYLE, 1);
                    }
                }
            },
            {
                name: 'stylesDisabled disables styles, even a forced one; default is on',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN, { Settings: {} }), day(12, 25)).presetId, 'christmas');
                    AssertionHelpers.assertEqual(StyleService.resolve(server(LanguageEnum.EN, { Settings: { stylesDisabled: true } }), day(12, 25)).presetId, null);
                    OverrideService.set(OverrideKeyEnum.STYLE, 1, 'christmas');
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
