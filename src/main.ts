import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import './styles/main.css';
import './styles/units123.css';

import { hats } from './screens/hats';
import { home } from './screens/home';
import { level } from './screens/level';
import { map } from './screens/map';
import { createStage, nav } from './screens/nav';
import { story } from './screens/story';
import { tower } from './screens/tower';
import { getUnit } from './units';

nav.init(createStage(document.getElementById('app')!));
nav.register('home', home);
nav.register('story', story);
nav.register('hats', hats);
nav.register('tower', tower);
nav.register('map', map);
nav.register('level', level);

// Deep links for teachers/testing:
//   ?level=4-3   jump to Unit 4, level 3
//   ?finale=4    watch Unit 4's ending
//   ?all         unlock every level (see store.ts)
const q = new URLSearchParams(location.search);
const jump = q.get('level')?.match(/^(\d+)-(\d+)$/);
const finale = getUnit(Number(q.get('finale')));
if (jump) nav.go('level', { unit: +jump[1], index: +jump[2] - 1 });
else if (finale?.finale) nav.go('story', { beats: finale.finale, next: 'map', params: { unit: finale.num } });
else nav.go('home');
