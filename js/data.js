// Every figure in the shop. Prices are in Moroccan dirhams.
// power / speed / rarity are playful "stats" for the character-select screen (0-100).

export const UNIVERSES = {
  dbz:  { label: 'Dragon Ball',     tint: '#ffd8a8', ink: '#e8590c' },
  hxh:  { label: 'Hunter x Hunter', tint: '#c3fae8', ink: '#0c8599' },
  ds:   { label: 'Demon Slayer',    tint: '#ffc9c9', ink: '#c92a2a' },
  op:   { label: 'One Piece',       tint: '#fff3bf', ink: '#e67700' },
  bor:  { label: 'Boruto',          tint: '#d0ebff', ink: '#1864ab' },
};

const img = (f) => `img/${f}`;

export const PRODUCTS = [
  {
    id: 'goku', name: 'Goku Kaioken', line: 'Banpresto · Ichiban Kuji Masterlise',
    uni: 'dbz', price: 1400, type: 'Scale figure', power: 96, speed: 88,
    images: [img('gk.jpg'), img('gk2.jpg'), img('gk3.jpg')],
    blurb: 'Lot C of the "Decisive Battle" Ichiban Kuji lottery. Goku mid-Kaioken, every muscle sculpted, glowing red gi. The centrepiece of any Dragon Ball shelf.',
  },
  {
    id: 'kaido', name: 'Kaido', line: 'Banpresto · Ichibansho Full Force · 28 cm',
    uni: 'op', price: 2400, type: 'Scale figure', power: 100, speed: 54,
    images: [img('kaido.jpg'), img('kiado2.jpg'), img('kaido1.jpg')],
    blurb: 'The Emperor of the Beasts in a 28 cm PVC sculpt. Dynamic pose, furious expression, Wano arc detail on every scale of the club.',
  },
  {
    id: 'zoro', name: 'Roronoa Zoro', line: 'One Piece · Model Story One',
    uni: 'op', price: 599, type: 'Scale figure', power: 90, speed: 80,
    images: [img('zoro.jpg')],
    blurb: 'Zoro in full three-sword stance, sculpted with all his Wano determination. A collector piece with real movement in the coat.',
  },
  {
    id: 'rengoku', name: 'Kyojuro Rengoku', line: 'SEGA SPM · Demon Slayer',
    uni: 'ds', price: 699, type: 'Scale figure', power: 92, speed: 86,
    images: [img('rengoko.jpg')],
    blurb: 'The Flame Hashira in an ultra dynamic pose. 15 cm PVC statue on its own base, flames swirling off the blade.',
  },
  {
    id: 'killua', name: 'Killua Zoldyck', line: 'Funko Pop! · Hunter x Hunter',
    uni: 'hxh', price: 249, type: 'Funko Pop!', power: 78, speed: 98,
    images: [img('xh1.jpg'), img('killua.jpg')],
    blurb: 'The Zoldyck heir, Godspeed ready. Vinyl Funko Pop, window box included.',
  },
  {
    id: 'gon', name: 'Gon Freecss', line: 'Funko Pop! · Jajanken',
    uni: 'hxh', price: 249, type: 'Funko Pop!', power: 84, speed: 82,
    images: [img('xh.jpg'), img('GON2.jpg')],
    blurb: 'Rock... paper... Gon charging his Jajanken. Vinyl Funko Pop in its window box.',
  },
  {
    id: 'hisoka', name: 'Hisoka Morow', line: 'Funko Pop! · Hunter x Hunter',
    uni: 'hxh', price: 249, type: 'Funko Pop!', power: 88, speed: 84,
    images: [img('xh3.jpg'), img('HISOKA1.jpg')],
    blurb: 'The Magician. Former Phantom Troupe member, full-time menace. Vinyl Funko Pop.',
  },
  {
    id: 'tanjiro', name: 'Tanjiro Kamado', line: 'Funko Pop! · Demon Slayer',
    uni: 'ds', price: 299, type: 'Funko Pop!', power: 80, speed: 82,
    images: [img('ggg1.jpg'), img('TANJIRO.jpg')],
    blurb: 'Water Breathing, first form. Tanjiro in his checkered haori. Vinyl Funko Pop.',
  },
  {
    id: 'nezuko', name: 'Nezuko Kamado', line: 'Funko Pop! · Demon Slayer',
    uni: 'ds', price: 299, type: 'Funko Pop!', power: 82, speed: 76,
    images: [img('ggg.jpg'), img('NEZUKO.jpg')],
    blurb: 'Bamboo muzzle, pink kimono, demon strength. Vinyl Funko Pop.',
  },
  {
    id: 'zenitsu', name: 'Zenitsu Agatsuma', line: 'Funko Pop! · Demon Slayer',
    uni: 'ds', price: 299, type: 'Funko Pop!', power: 74, speed: 99,
    images: [img('ggg2.jpg')],
    blurb: 'Thunder Breathing, first form, Thunderclap and Flash. Asleep and unstoppable. Vinyl Funko Pop.',
  },
  {
    id: 'vegeta', name: 'Majin Vegeta', line: 'Funko Pop! · Dragon Ball Z',
    uni: 'dbz', price: 299, type: 'Funko Pop!', power: 93, speed: 85,
    images: [img('kamehameha.jpg'), img('VIGITA.jpg')],
    blurb: 'The Prince of all Saiyans, M on his forehead and pride intact. Vinyl Funko Pop.',
  },
  {
    id: 'boruto', name: 'Boruto Uzumaki', line: 'Naruto Next Generations · with Marks',
    uni: 'bor', price: 299, type: 'Figure', power: 76, speed: 87,
    images: [img('boruto.jpg'), img('BOBO.jpg')],
    blurb: 'Boruto with his Karma mark glowing. Next generation, same Uzumaki energy.',
  },
];

// The boss of the shop: the featured deal.
export const BOSS = {
  id: 'bardock', name: 'Bardock', line: 'Banpresto · Dragon Ball Z',
  uni: 'dbz', price: 699, was: 899, type: 'Scale figure', power: 95, speed: 80,
  images: [img('gogo.jpg.png')], stock: 7,
  blurb: 'Saiyan armour, red headband, fists clenched. Exclusive to the Tarik Anni store.',
};

export const ALL = [...PRODUCTS, BOSS];
export const byId = (id) => ALL.find((p) => p.id === id);

// Rarity tier from price, like a gacha.
export function rarity(p) {
  if (p.price >= 1400) return 'UR';
  if (p.price >= 599) return 'SSR';
  if (p.price >= 299) return 'SR';
  return 'R';
}

export const QUOTES = [
  {
    who: 'Monkey D. Luffy', img: img('luf.png'), uni: 'op',
    text: "I don't want to hear about the seas I haven't sailed yet. I want to sail on the seas that I can sail on, and become the Pirate King!",
  },
  {
    who: 'Uchiha Madara', img: img('mdr.jpg'), uni: 'bor',
    text: "It's not about changing the world, it's about doing our best to leave the world the way it is. It's about respecting the will of others and believing in your own.",
  },
  {
    who: 'Monkey D. Dragon', img: img('bah.jpg'), uni: 'op',
    text: "The world is changing, and we're changing with it. That's what it means to be alive.",
  },
];

export const INSTAGRAM = 'https://www.instagram.com/32ni.off/';
export const INSTAGRAM_DM = 'https://ig.me/m/32ni.off';
