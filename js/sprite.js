// Hand-placed 16x16 pixel art, drawn to tiny canvases and upscaled with
// image-rendering: pixelated. The hero walks the level map in the HUD.

const PAL = {
  K: '#1b1528', S: '#ffcf9e', s: '#e8a774', O: '#ff6b1a', o: '#d9480f', B: '#2f5fd0',
  b: '#1c3f99', Y: '#ffd23f', R: '#e03131', W: '#ffffff', G: '#12b886', H: '#3b2a1a',
};

const HERO_TOP = [
  '......K..K.K....',
  '....KKKKKKKK....',
  '...KKKKKKKKKK...',
  '..KKKKKKKKKKKK..',
  '...RRRRRRRRRR...',
  '...SSSSSSSSSS...',
  '...SSWKSSWKSS...',
  '...SSSSSSSSSS...',
  '....SSSKKSSS....',
  '...OOOOOOOOOO...',
  '..SOOOOooOOOOS..',
  '..S.OOYYYYOO.S..',
];
const HERO_A = [...HERO_TOP,
  '....BBBBBBBB....',
  '....BBB..BBB....',
  '....BB....BB....',
  '...KKK....KKK...',
];
const HERO_B = [...HERO_TOP.slice(0, 10),
  '..SOOOOooOOOO...',
  '....OOYYYYOOS...',
  '....BBBBBBBB....',
  '...BBB....BBB...',
  '..BB.......BB...',
  '.KKK.......KKK..',
];
const HERO_C = [...HERO_TOP.slice(0, 10),
  '...OOOOooOOOOS..',
  '...SOOYYYYOO....',
  '....BBBBBBBB....',
  '.....BBBBBB.....',
  '.....BB..BB.....',
  '....KKK..KKK....',
];

// the shopkeeper NPC portrait
const KEEPER = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HHSSSSSSHH...',
  '...HSSSSSSSSH...',
  '...SSKKSSKKSS...',
  '...SSWKSSWKSS...',
  '..sSSSSSSSSSSs..',
  '...SSSSssSSSS...',
  '...SSSKKKKSSS...',
  '....SSSSSSSS....',
  '.....SSSSSS.....',
  '...GGGGSSGGGG...',
  '..GGGGGYYGGGGG..',
  '.GGGGGGYYGGGGGG.',
];

export function draw(ctx, rows, flip = false) {
  ctx.clearRect(0, 0, 16, 16);
  rows.forEach((row, y) => {
    for (let x = 0; x < 16; x++) {
      const c = PAL[row[x]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(flip ? 15 - x : x, y, 1, 1);
    }
  });
}

export const FRAMES = { idle: HERO_A, walk: [HERO_B, HERO_A, HERO_C, HERO_A] };
export const KEEPER_ART = KEEPER;
