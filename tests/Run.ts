import 'reflect-metadata';
import TestMode from '../src/utils/application/TestMode';

TestMode.enable();

import('./TestRunner').then(({ main }) => main());
