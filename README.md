# Anime Quest · Tarik Anni figure shop

My first website, rebuilt as a game. One page and five linked stages, with a pixel hero walking the level map in the HUD as you scroll.

| Stage | What it is |
|---|---|
| 1 · Title screen | A 3D world built in code with Three.js: a cel-shaded wish orb, orbiting mini orbs, a floating island. Tap the orb seven times for a wish. **3D / PIXEL** re-renders the scene as pixel art. |
| 2 · Character select | The shop. Filter by universe, sort, hover to preview stats, click for the full profile, add to your inventory. Arrow keys move the 1P cursor. |
| 3 · Boss battle | The featured deal. Every strike drops the boss's HP and puts one in your bag. |
| 4 · Lore | Anime quotes in an RPG dialogue box, plus the shop's achievements. |
| 5 · Save point | About me and a message form. |

The cart is saved in the browser. Checkout ("Complete quest") copies the order and opens my Instagram DM, so orders come straight to me. There is no payment backend.

Sound effects and animations each have a toggle in the HUD. Animations start off when the visitor's system asks for reduced motion.

## Run it

It's a static site, but it uses ES modules, so serve it rather than opening the file directly:

```
python -m http.server 5173
```

Then open http://localhost:5173.

## Files

- `index.html`: every stage, plus the profile, inventory and quest-complete dialogs
- `css/style.css`: the whole look (manga paper, arcade HUD, motion timings)
- `js/data.js`: products, prices, quotes
- `js/app.js`: shop logic, cart, level map, boss, dialogue, forms
- `js/scene.js`: the Three.js title world
- `js/sprite.js`: 16×16 pixel art for the hero and the shopkeeper
