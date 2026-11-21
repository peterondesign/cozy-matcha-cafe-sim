# Little Matcha Days: Visual World Inventory

Version: visual rebuild 01  
Purpose: establish a complete scene-by-scene visual inventory before redrawing, regrouping, or replacing assets.

This document records what the current game shows, which visual layers make up each scene, which states need distinct art, and where the existing presentation lacks harmony. It is an inventory, not a final art bible. The next stage should turn each listed item into an asset record with one owner, one style family, one scale, and one export specification.

## Rebuild structure

The new visual version should use these seven working areas:

```text
visual-rebuild/
  01-art-direction/
  02-environment/
  03-characters/
  04-hud-components/
  05-progression-states/
  06-gameplay-screens/
  07-asset-exports/
```

Do not copy the current asset folder into this structure yet. First classify each asset by scene and function. Assets should be approved into the rebuild only after their perspective, line quality, palette, texture, lighting, and scale agree with the new system.

---

# 01. Art Direction

## Current visual identity

- Cozy Japanese-inspired matcha cart and small village park.
- Hand-painted storybook illustration mixed with flat interface illustration and some real-time 3D.
- Warm cream paper, honey wood, moss and sage greens, muted blossom pink, ceramic white, and small gold accents.
- Soft morning light, gentle shadows, drifting petals, moving leaf shadows, and paper-like warmth.
- Rounded panels and controls with double borders, inset highlights, soft brown shadows, and botanical colors.
- Georgia-style serif typography for the world and headings, with a compact system sans serif for status text.
- The emotional target is quiet, cared-for, handmade, safe, and lightly nostalgic.

## Existing core palette

| Role | Current color family | Existing examples | Rebuild intent |
|---|---|---|---|
| Ink | Dark tea brown | `#493723`, `#513b28` | Use for primary copy and drawn outlines |
| Soft ink | Warm grey-brown | `#77654e`, `#806d50` | Secondary copy and quiet outlines |
| Paper | Matcha cream | `#f7eccf`, `#fff7df` | Panels, labels, cards, speech bubbles |
| Primary green | Sage and moss | `#8ca34d`, `#637a37` | Success, active states, matcha identity |
| Blossom | Dusty rose | `#cb8e80`, `#d48392` | Flowers, warmth, selected accents |
| Reward | Honey gold | `#d6a349`, `#efbd50` | Coins, stars, target moments |
| Timber | Walnut and cedar | `#81553e`, `#a96944`, `#c99362` | Buildings, cart, shelves, furniture |
| Evening | Forest green | `#263b31`, `#293d2e` | Night framing, HUD contrast, atmosphere |

## Lighting states

### Morning

- Warm, pale sunlight from above and to one side.
- Cream surfaces stay bright without becoming pure white.
- Matcha green is fresh and slightly yellow.
- Timber is honey-colored rather than red.
- Leaf shadows and petals give the static plate subtle life.

### Afternoon

- Grocery interior uses a warmer, more enclosed cream light.
- Directional sunlight enters near the checkout windows.
- Shelves and packages need readable value separation without harsh contrast.

### Evening

- Dedicated evening plates exist for the park and service counter.
- Lanterns and string lights become the warm focal points.
- Greens become cooler and deeper while cream UI remains readable.
- Current implementation blends between day and evening art. New art must align exactly between both states.

### Night seating views

- Picnic mat, yoga mat, and plaza seat each have separate night plates.
- These should share one moonlight direction, one sky color, and one lantern temperature.

## Camera and perspective families

The current game combines four different camera systems. They must be deliberately unified rather than treated as interchangeable.

1. **Counter POV:** straight-on first-person view from behind the work counter.
2. **Village map:** elevated isometric or three-quarter painted park view.
3. **Grocery:** first-person real-time 3D aisle.
4. **Seated views:** immersive first-person panoramas or wide plates.

## Reference scenes to approve before production

- Title screen in the blossom garden.
- Morning counter with one customer and a readable work surface.
- Evening counter with lit upgrades.
- Full village park during morning.
- Full village park during evening.
- Grocery aisle with unified packages and shelves.
- Kitchen garden puzzle presented as part of the same world.
- One seated rest view.
- One complete HUD sheet over a neutral background.
- One character lineup at consistent scale and lighting.

## Current harmony problems to solve

- Painted background plates, generated customer cutouts, SVG props, CSS shapes, 3D residents, and photographic ingredient images do not all share the same rendering language.
- Some interface pieces look like parchment, while others look like generic web UI.
- Ingredient photography conflicts with the illustrated environment and characters.
- Character portraits, full-body customer cutouts, and 3D resident models vary in proportions and finish.
- The park mixes a painted plate, vector overlays, PNG decorations, and real-time models.
- Decoration upgrades have inconsistent crop, lighting, edge softness, and implied camera angle.
- The grocery interior is materially cleaner and more geometric than the painted outdoor world.
- Recipe action GIFs are useful but need one consistent crop, bowl scale, hand style, and background.
- Several assets encode their own background, shadow, or lighting, making them hard to combine cleanly.

## Non-negotiable rebuild rules

- Every world asset belongs to one camera family and cannot be reused in another without a purpose-made variant.
- All transparent sprites use a shared ground line, scale guide, light direction, and shadow rule.
- Every UI component uses the same corner system, border weights, shadow recipe, and text styles.
- Ingredients should be redrawn as illustrations. Do not mix stock photography into final gameplay panels.
- Day and evening plates must have identical geometry and registration.
- Damage, cleaning, renovation, and decoration must change the same base structure rather than replacing it with unrelated compositions.
- Decorative upgrades must have explicit anchor points and occlusion order.
- Exported files should not include baked UI, labels, or unrelated scenery unless the asset is a deliberately flattened background plate.

---

# 02. Environment

## A. Title garden

### Visible composition

- Full-screen painted garden cover.
- Pale cream light wash from the left.
- Cherry blossom trees and green garden scenery.
- Open negative space on the left for the title and opening copy.
- Game title, short introduction, and green pill-shaped start button.

### Required environment layers

- Distant garden background.
- Midground blossom trees and shrubs.
- Foreground flowers, branches, or soft framing leaves.
- Optional drifting petals.
- Morning light overlay.
- Mobile crop variant that keeps the important garden focal point visible.

### Existing source

- `game/assets/brand/garden-cover.webp`

## B. Café service counter

### Visible composition

- First-person position behind a timber counter.
- Timber café or cart structure framing the scene.
- Garden and blossoms beyond the customer.
- Central customer standing across the counter.
- Speech bubble to the customer's upper right.
- Counter foreground masks the lower body and preparation pieces.
- Optional decorations appear around the stall as upgrades are purchased.

### Base environment layers

1. Distant garden and sky.
2. Café walls, roof, posts, beams, and service opening.
3. Midground customer standing zone.
4. Counter surface and preparation zone.
5. Counter front foreground occlusion.
6. Moving leaf-shadow overlay.
7. Falling blossom petals.
8. Day or evening color and light treatment.

### Base architectural inventory

- Floor or deck beneath the customer.
- Timber posts and beams.
- Roof or awning edge.
- Back garden opening.
- Serving window.
- Main work counter.
- Counter fascia.
- Open or closed sign position.
- Customer queue or approach path.
- Preparation anchors for bowl and glass.

### Service props

- Chawan.
- Chasen bamboo whisk.
- Fine sieve.
- Kettle.
- Tall glass.
- Ice.
- Milk and oat milk containers.
- Matcha tin or bowl.
- Finished hot matcha.
- Finished iced latte.
- Steam and foam overlays.
- Pour overlays for water, milk, matcha, syrup, and honey.

### Existing visual sources

- `game/assets/cafe_background_plate.webp`
- `game/assets/counter-evening.jpg`
- `game/assets/tools/`
- `game/assets/chawan.svg`
- `game/assets/tumbler.svg`
- `game/assets/matcha_bowl.svg`
- `game/assets/order_latte_icon.png`

## C. Village park

### Visible composition

- Elevated painted map filling the screen.
- Curving sand paths over a green lawn.
- Café deck on the left or upper-left zone.
- Kitchen garden beds in the lower-left zone.
- Round plaza or activity lawn in the upper-right zone.
- Grocery shop and entrance on the right.
- Secondary open activity area in the lower-right zone.
- Trees, cherry trees, flowers, benches, lamps, fences, and gates distributed through the park.
- Walking residents, the barista, a dog, football players, and activity groups.
- Floating destination labels and interaction prompt.

### Ground and path layers

- Lawn base with subtle variation.
- Main winding sand path.
- Branch paths to café, garden, grocery, plaza, and exits.
- Circular gathering ground.
- Lower activity patch.
- Garden soil and planting rows.
- Grocery threshold ground.
- Café timber deck.
- Object shadows and contact patches.

### Park structures

- Tea cart or café in four size states.
- Deck and steps.
- Grocery shop facade.
- Grocery door or entrance trigger.
- Garden fence and arched gate.
- Benches.
- Lamp posts and lanterns.
- Small seating areas.
- Picnic mat location.
- Yoga mat location.
- Plaza seat location.

### Natural props

- Green canopy trees.
- Cherry blossom trees.
- Painted foreground tree used for character occlusion.
- Flower clumps.
- Shrubs.
- Planters.
- Grass accents.
- Loose petals.
- Evening lamp glows.

### Activity props

- Football.
- Dog lead or dog-walking accessories.
- Painter's materials.
- Florist flowers.
- Gardener tools.
- Post bag.
- Hiking gear.
- Skating gear.
- Picnic objects.
- Tea table and cups.

### Existing visual sources

- `game/assets/park-painted.jpg`
- `game/assets/park-evening.jpg`
- `game/assets/park-painted-tree.png`
- `game/assets/park-evening-tree.png`
- `game/assets/park-actions.webp`
- `game/assets/park-walkers.webp`
- `game/assets/park-seated.webp`
- `game/assets/grocery-ground.jpg`
- `game/assets/stall/`
- `game/assets/decor/`
- Vector scenery definitions in `game/park-art.js`

## D. Grocery exterior and entrance

### Visible composition

- Grocery facade embedded in the park scene.
- Ground patch that visually connects the painted park to the 3D interior trigger.
- Shop frontage, door or opening, sign, windows, awning, and threshold.
- Residents may pass or stand nearby.

### Rebuild requirement

The exterior must visually predict the interior. Timber color, sign lettering, window layout, product colors, and lighting should carry through both views.

## E. Grocery interior

### Visible composition

- First-person central aisle.
- Alternating cream floor tiles.
- Walnut shelving on both sides.
- Six product departments with overhead aisle signs.
- Repeated packages arranged on shelf rows.
- Checkout counter and clerk.
- Herb pots and striped valance around the register.
- Garden entrance at the far end.
- Basket or cart fixed in front of the player's camera.
- Warm afternoon light and light fog softening the distance.

### Departments

1. Tea and infusions.
2. Orchard fruit.
3. Dairy and oat.
4. Cold cabinet.
5. Garden fruit.
6. Baking pantry.

### Product inventory shown visually

- Matcha powder.
- Strawberries.
- Oat milk.
- Regular milk.
- Ice.
- Water.
- Sugar syrup.
- Vanilla extract.
- Blueberries.
- Coconut milk.
- Tea leaves.
- Pineapple.
- Banana.
- Honey.
- Peach.
- Watermelon.
- Mango.
- Fresh coconut.
- Juice.

### Required environment assets

- Floor tile set.
- Ceiling and beams.
- Side walls.
- End walls and windows.
- Shelf bay modular kit.
- Checkout counter.
- Register.
- Department signs.
- Checkout sign.
- Garden entrance sign.
- Herb pots.
- Fabric valance.
- Grocery basket or cart.
- Nineteen package families with front, side, and top faces.

## F. Kitchen garden puzzle

### Visible composition

- Modal or dedicated panel titled `Kitchen garden`.
- Five-row by seven-column tile bed.
- Illustrated ingredient tiles.
- Selection ring, hint state, matched state, and harvest particles.
- Moves meter.
- Buy-moves callout.
- Inventory panel showing gathered portions.

### Environment interpretation

The current implementation reads as a board game inside a parchment modal. The rebuild should decide whether this is:

- a literal overhead garden bed with planted crops,
- an illustrated seed tray,
- or an abstract puzzle board owned by the UI.

That decision changes how tiles, borders, soil, shadows, and harvest effects should be drawn.

## G. Seated rest views

### Existing viewpoints

- Picnic mat, day and night.
- Yoga mat, day and night.
- Plaza seat, day and night.

### Visible requirements

- First-person resting perspective.
- Ground or seat visible at the bottom edge.
- Recognizable park landmarks in the distance.
- Navigation controls layered over the view.
- Consistent day and night registration.

### Existing sources

- `game/assets/pov/picnic-mat.jpeg`
- `game/assets/pov/picnic-mat-night.jpeg`
- `game/assets/pov/yoga-mat.jpeg`
- `game/assets/pov/yoga-mat-night.jpeg`
- `game/assets/pov/plaza-seat.jpg`
- `game/assets/pov/plaza-seat-night.jpg`

---

# 03. Characters

## A. Player character: MatchaMika

### Current appearances

- Small circular HUD portrait.
- Full 3D walking character in the village.
- Implied first-person barista at the counter, with no visible hands.
- Named profile with level and satisfaction.

### Character sheet required

- Front, three-quarter front, side, three-quarter back, and back turnarounds.
- Neutral standing pose.
- Walk and run key poses.
- Serving pose.
- Carrying pose.
- Greeting pose.
- Gardening pose.
- Shopping pose.
- Sitting pose.
- Portrait crop.
- Simplified small-scale map version.
- Optional first-person hands and sleeves for counter actions.

### Expression set

- Neutral.
- Welcoming smile.
- Focused.
- Proud.
- Tired.
- Concerned about low stock.
- Surprised.
- Celebrating.

### Existing sources

- `game/assets/barista-model.js`
- `game/assets/mika-portrait.png`
- `game/assets/park-barista.webp`

## B. Core café customers

| Character | Current visual role | Personality line or cue | Required rebuild views |
|---|---|---|---|
| Mrs. Sato | Elderly first customer | Plain first bowl, values the tea itself | Full counter pose, portrait, park walk, expressions |
| Nia | Young Black woman, potter association | Mentions making a bowl in the studio | Full counter pose, portrait, park walk, expressions |
| Arjun | South Asian man | Requests smooth matcha | Full counter pose, portrait, park walk, expressions |
| Ren | Young East Asian man | Open to a surprise | Full counter pose, portrait, park walk, expressions |
| Mara | Copper-haired woman | Wants a green pick-me-up | Full counter pose, portrait, park walk, expressions |

### Core customer expressions

- Waiting calmly.
- Ordering.
- Curious.
- Pleased.
- Delighted.
- Disappointed.
- Leaving because an ingredient is unavailable.
- Drinking or holding the finished order.

### Existing sources

- `game/assets/customers/elderly-woman.png`
- `game/assets/customers/young-black-woman.png`
- `game/assets/customers/south-asian-man.png`
- `game/assets/customers/young-east-asian-man.png`
- `game/assets/customers/copper-haired-woman.png`
- `game/assets/customers/hana-florist.webp`
- `game/assets/customers/nia-potter.webp`

## C. Village residents

### Current resident families

- Baker.
- Blue-shirt resident.
- Copper-haired resident.
- Elder.
- Florist.
- Gardener.
- Green-shirt resident.
- Hiker.
- Librarian.
- Painter.
- Postwoman.
- Rose-shirt resident.
- Seamstress.
- Skater.
- Tailor.
- Dog walker and dog.
- Football players, currently derived from existing resident models.

### Required sheet for each named resident

- Full-body neutral design.
- Front and side proportions.
- Portrait crop.
- Walk cycle parts or rig-ready turnaround.
- One role-specific activity pose.
- Greeting expression.
- Day outfit color record.
- Evening color treatment.
- Prop list.

### Existing sources

- `game/assets/resident-*.js`
- Customer cutouts reused as visual or modeling references.

## D. Grocery keeper

### Required views

- Standing behind checkout.
- Greeting.
- Watching the aisle.
- Taking payment.
- Handing over a bag.
- Portrait or prompt crop.

## E. Character consistency rules

- One body proportion system for all human characters.
- One eye, nose, mouth, hand, and hair rendering language.
- One outline and edge-softness rule.
- Shared top light direction and ground shadow.
- Consistent skin tone handling across portraits, full bodies, and 3D textures.
- Clothing palettes must fit the world palette while keeping silhouettes distinct.
- Counter cutouts and park characters should clearly be the same people.
- Do not derive small background characters by arbitrary recoloring if they have speaking roles.

## F. Sprite and rig parts

- Head.
- Hair back and hair front.
- Eyebrows.
- Eyes and blink states.
- Nose.
- Mouth expression set.
- Neck.
- Torso.
- Upper and lower arms.
- Hands and held-object variants.
- Hips.
- Upper and lower legs.
- Feet.
- Clothing overlays.
- Role props.
- Front and rear occlusion masks.
- Contact shadow.

---

# 04. HUD and Components

## A. Global HUD

- Brand badge with circular portrait or logo.
- Day number and clock capsule.
- Customer satisfaction or shift status.
- Live system-status chip with calm, success, warning, and tip tones.
- Coin wallet with illustrated coin stack.
- Player profile, level, progress meter, and satisfaction in the village.
- Save-shift pill and account panel.
- Pause menu dock button.

## B. Service order HUD

- Order ticket panel.
- Customer portrait badge.
- Customer name and mood line.
- Drink card.
- Drink thumbnail.
- Quantity badge.
- Recipe progress label.
- Step rail.
- Numbered or checked recipe dots.
- Order note.
- Order quality value and fill bar.
- Preparation panel.
- Recipe category badge.
- Action row.
- Action GIF thumbnail.
- Keyboard number chip.
- Completed check badge.
- Instruction footer.

## C. Customer communication

- Floating customer name label.
- Round speech bubble with order image.
- Bubble tail.
- Waiting, ordering, and reaction dialogue variants.
- World interaction prompt with hand icon and keyboard hint.
- Toast message.
- Bottom instruction hint.

## D. Skill interactions

### Whisking

- Illustrated action guide.
- Circular whisk dial.
- Moving input marker.
- Ideal target segment.
- Whisk instruction label.
- Rhythm or accuracy response.

### Precision pour

- Horizontal timing meter.
- Sage target zone.
- Moving needle.
- Steady and target captions.
- Circular hold arc.
- Target segment at 76 percent.
- Percentage readout.
- Release instruction.

## E. Results and rewards

- Dimmed world veil.
- Served drink image.
- Zero-to-three star display.
- Result title.
- Result explanation.
- Level or satisfaction note.
- Coin reward capsule.
- Explore-park button.
- Next-customer button.
- Coin flight particles.
- Quality increase or decrease guide path.
- Spark and celebration particles.

## F. Village navigation

- Destination labels.
- Four-direction D-pad.
- Ground click or tap destination marker.
- Interaction bubble.
- Go-to-counter button.
- Park footer instructions.
- World-space greeting prompt.

## G. Grocery HUD

- Market sign.
- Coin wallet.
- Center crosshair.
- Product pickup prompt.
- Product name and price.
- Basket or receipt list.
- Quantity increment and decrement controls.
- Pay button.
- Exit or return control.
- Insufficient-coins state.

## H. Menus and overlays

### Pause menu

- Tea bowl hero image.
- Resume game.
- Inventory and upgrades.
- Recipe book.
- Leaderboard.
- World map.
- Quest journal.
- Settings.
- New game.
- Player, day, level, and coin footer.

### Inventory and upgrades

- Category tabs: Ingredients, Equipment, Decorations, Stall.
- Ingredient cards with quantity, low-stock copy, and meter.
- Equipment ownership cards.
- Decoration cards with cost, preview, and lock state.
- Stall progression cards.
- Restock button.

### Recipe book

- Satisfaction progress.
- Unlocked recipe entries.
- Locked recipe entries.
- Drink image.
- Ingredient summary.
- Expandable ordered preparation steps.

### World map

- Painted park thumbnail.
- Café label.
- Garden label.
- Grocery label.

### Quest journal

- Satisfaction meter.
- Drinks-served count.
- Next recipe unlock.
- Complete-collection state.

### Leaderboard

- Barista name.
- Drinks served.
- Level.
- Satisfaction.
- Highlighted current player row.

### Settings

- Music and sound entry.
- Coin purse entry.
- Volume controls.

### Account and cloud save

- Save-shift pill.
- Email field.
- Password field.
- Confirm-password state.
- Show-password link.
- Sign-in and create-account modes.
- Forgot-password state.
- Success, loading, and error messages.

## I. Component states every design must include

- Default.
- Hover.
- Pressed.
- Focused.
- Disabled.
- Selected.
- Completed.
- Locked.
- Low stock.
- Insufficient currency.
- New unlock.
- Success.
- Warning.
- Error.
- Loading.
- Mobile compact form.

---

# 05. Progression States

## A. Core restoration sequence for the rebuilt world

The existing game currently focuses on stall upgrades, not a complete damage-to-renovation visual arc. The rebuild should define the same location through four readable phases.

### State 0: Damaged

- Faded, cracked, or missing sign.
- Weathered timber and uneven floorboards.
- Torn awning or exposed roof frame.
- Dust, leaf piles, stains, weeds, and abandoned containers.
- Clouded windows.
- Broken or missing furniture.
- Empty planters.
- Inactive lamps.
- Sparse shelves and no decorative objects.
- Muted palette and flatter lighting.

### State 1: Cleaned

- Dirt, leaves, weeds, and loose rubbish removed.
- Timber still old but visibly washed.
- Windows clear.
- Counter usable.
- Floor readable and safe.
- Basic sign restored enough to open.
- Empty spaces make future upgrades obvious.
- Lighting becomes warmer but remains simple.

### State 2: Renovated

- Repaired roof, walls, deck, counter, shelves, and windows.
- Fresh timber finish.
- Working serving window.
- Complete base furniture.
- Working lights.
- Organized preparation area.
- New neutral sign.
- Stronger morning light and cleaner shadows.

### State 3: Decorated

- Player-selected decorative set applied to the renovated base.
- String lights.
- Sage bunting.
- Wind chime.
- Hanging fern.
- Flower pots.
- Tea jars.
- Welcome mat.
- Matcha chalkboard.
- Garden tea table.
- Deck cushions.
- Large planters.
- Lounge seating.
- Evening glow and celebratory detail.

## B. Existing stall growth states

| Stage | Existing representation | Visual meaning |
|---|---|---|
| 0 | Designer tea cart | Small starting service point |
| 1 | Kiosk awning | Cart gains shelter, pots, and menu |
| 2 | Small café | Adds shelves, wheel, and service window |
| 3 | Café front | Finished shop with lights, flowers, and seating |

### Existing sources

- `game/assets/stall/designer-cart.png`
- `game/assets/stall/kiosk.png`
- `game/assets/stall/small.png`
- `game/assets/stall/cafe.png`
- `game/assets/stall/stall-stages.png`
- `game/assets/stall/deck.png`

## C. Existing decoration upgrades

- Premium bamboo whisk.
- Milk frothing machine.
- String lights.
- Sage bunting.
- Wind chime.
- Hanging fern.
- Flower pot.
- Tea jars.
- Garden tea table.
- Welcome mat.
- Deck cushions.
- Matcha chalkboard.
- Grand canopy.
- Lantern court.
- Orchard planters.
- Lounge cushions.
- Grand matcha board.

## D. Required art for every progression object

- Shop-card preview.
- Locked silhouette.
- World-space daytime sprite.
- World-space evening sprite.
- Placement ghost or selected outline.
- Purchase reveal frame.
- Anchor point and bounds.
- Front and rear occlusion variants when characters can walk behind it.
- Damaged variant where relevant.
- Cleaned variant where relevant.
- Renovated base variant where relevant.

## E. Progression continuity rule

The building footprint, major posts, floor plane, service opening, and camera must remain fixed through all four restoration states. A player should read improvement in the same place. If the composition changes completely, the progression loses its emotional value.

---

# 06. Gameplay Screens

## Screen 01: Title and first opening

- Garden cover fills the screen.
- Logo or title on the left.
- Introductory line names the first customer.
- Primary action opens the tea cart.
- Visual job: establish warmth, place, character, and morning ritual before showing systems.

## Screen 02: Waiting at the counter

- Empty or approaching customer stage.
- Café background, counter, petals, and leaf shadows.
- Global HUD visible.
- Status says the game is waiting for a customer.
- Open or closed sign communicates service state.

## Screen 03: Customer arrival and order

- Customer walks up or appears at center.
- Name tag and order speech bubble appear.
- Order ticket fills with portrait, drink, and note.
- Preparation list becomes active.
- Visual job: connect the person, requested drink, and next action immediately.

## Screen 04: Standard drink preparation

- Current action row is highlighted.
- Action GIF shows the physical change.
- Counter bowl or glass updates through the recipe.
- Step rail and dots fill.
- Quality remains visible.
- Toast and guide path explain changes.

## Screen 05: Whisk minigame

- Central interaction panel overlays the counter.
- Larger whisk artwork or loop.
- Circular dial and ideal rhythm zone.
- Customer and café remain visible behind the panel.
- Visual job: make timing readable without losing the cozy physical act.

## Screen 06: Precision pour minigame

- First phase uses horizontal moving needle and green stop zone.
- Second phase uses circular hold arc and release target.
- Relevant pour illustration appears above the control.
- Visual job: clearly distinguish stop, hold, and release.

## Screen 07: Completed order

- Served drink is the focal image.
- Stars show execution quality.
- Coins and satisfaction change.
- Result card offers park exploration or the next customer.
- Customer reaction should remain emotionally visible.

## Screen 08: Unavailable order

- Customer departs or reacts.
- Served-drink image is absent.
- Result card names the missing ingredient.
- Restock action becomes the clear next step.
- Satisfaction loss should be legible without feeling punitive or visually harsh.

## Screen 09: Village exploration

- Full painted park and moving player character.
- Profile, clock, satisfaction, and coins sit in the top HUD.
- Destination labels and interaction prompts appear contextually.
- Residents walk, talk, sit, play football, garden, paint, skate, or walk a dog.
- Day transitions to evening while the scene remains spatially stable.

## Screen 10: Resident interaction

- Barista stands near a resident or landmark.
- Floating prompt names the resident or action.
- Greeting or activity response appears.
- Optional small portrait and dialogue panel can be added in the rebuild.

## Screen 11: Garden harvest puzzle

- Garden board, moves meter, inventory, and buy-moves control.
- Selected tiles swap.
- Matches burst, disappear, and fly into inventory.
- Low-move state warms toward amber.
- No-move state strongly identifies the purchase or exit choices.

## Screen 12: Grocery approach

- Park character reaches the grocery threshold.
- Exterior sign and entrance clearly advertise the transition.
- Prompt enters the shop.

## Screen 13: Grocery shopping

- First-person aisle with crosshair.
- Packages are picked directly from shelves.
- Basket remains in the foreground.
- Receipt list updates with quantities and cost.
- Checkout clerk and register form the destination.

## Screen 14: Grocery checkout

- Cart contents and total are clear.
- Player wallet is visible.
- Clerk performs a payment or handoff reaction.
- Success, insufficient currency, and empty basket need separate visual states.

## Screen 15: Inventory and upgrades

- Illustrated item grid grouped into four categories.
- Owned, purchasable, locked, and unaffordable states are distinct.
- Decoration previews correspond exactly to objects placed in the world.

## Screen 16: Recipe book

- Unlocked drinks use full-color still-life art.
- Locked recipes use restrained silhouettes or covered cards.
- Expanded recipe shows ordered actions and ingredients.
- Six current drinks must be represented: Traditional Hot Matcha, Iced Matcha Latte, Oat Matcha Latte, Vanilla Oat Matcha, Strawberry Coconut Matcha, and Blueberry Honey Matcha.

## Screen 17: Pause menu

- Large tea bowl image and centered vertical navigation.
- Calm parchment framing.
- Current player, day, level, and coins remain visible.

## Screen 18: World map

- Reduced painted park view.
- Café, Garden, and Grocery labels.
- Rebuild may add locked future districts, but current scope is the three named destinations.

## Screen 19: Quest journal

- Satisfaction meter.
- Drinks served.
- Next recipe goal.
- Complete collection state.

## Screen 20: Leaderboard

- Compact four-column table.
- Current barista row highlighted in pale green.
- Must retain the game's handmade visual language instead of looking like a generic data table.

## Screen 21: Settings and audio

- Music and sound controls.
- Coin purse or demo currency state.
- Clear slider, mute, focus, and active states.

## Screen 22: Save and account

- Small persistent save pill.
- Expandable sign-in or account-creation card.
- Password visibility, reset, loading, success, and error states.
- Should feel like a quiet part of the game rather than an unrelated website form.

## Screen 23: Seated park rest

- Full-screen picnic, yoga, or plaza viewpoint.
- Minimal navigation overlay.
- Day and evening versions.
- Visual job: give the player a slower reward space between service loops.

## Screen 24: Mobile compact layouts

- Compressed top status.
- Small coin and quality panels.
- Service ticket reduces to the essential drink and quality information.
- Action controls remain thumb-readable.
- Park D-pad remains clear of interaction prompts.
- All modal grids and shop cards reflow without losing image scale.

---

# 07. Asset Exports

## A. Editable master formats

| Asset type | Working master | Runtime export |
|---|---|---|
| UI icon | Figma vector component | SVG |
| UI panel and button | Figma component with variants | CSS plus SVG or 9-slice PNG where needed |
| Character sheet | Layered Figma file, PSD, or layered illustration file | Transparent PNG or WebP atlas |
| 2D rigged character | Layered parts with fixed pivots | Transparent PNG parts, atlas, or rig package |
| Environment plate | Layered source illustration | WebP or PNG |
| Decoration sprite | Layered source illustration | Transparent PNG or WebP |
| Particle | Vector or layered raster master | SVG or transparent PNG |
| 3D character | Rigged GLB master | Optimized GLB plus texture atlas |
| 3D environment kit | Modular GLB source | Optimized GLB plus shared textures |

## B. SVG export list

- Currency coin and coin stack.
- Day, clock, level, satisfaction, and quality icons.
- D-pad arrows.
- Interaction hand.
- Menu, map, journal, settings, audio, save, lock, check, warning, and close icons.
- Recipe step icons: bowl, powder, hot water, whisk, ice, milk, glass, pour, fruit, honey, vanilla, coconut, oat, and serve.
- Chawan order icon.
- Tumbler order icons for every drink family.
- Progress pips and target markers.
- Speech-bubble shell and tail if kept vector-based.

## C. Transparent sprite export list

### Characters

- MatchaMika portrait and full-body views.
- Five core café customers.
- All named village residents.
- Grocery keeper.
- Dog.
- Activity poses and held props.

### Café and park

- Four stall stages.
- All decoration upgrades.
- Trees and foreground occluders.
- Benches, lamps, fences, gate, tables, cushions, mats, signs, planters, and flower clusters.
- Football and resident props.

### Service actions

- Chawan states: empty, warmed, matcha powder, water added, whisked foam, served.
- Glass states: empty, iced, milk, flavor base, matcha layer, finished drink.
- Separate pour streams.
- Steam.
- Foam.
- Sparkles.
- Ingredient splashes.
- Hand and tool layers if first-person hands are added.

### Grocery

- Nineteen product package families.
- Basket contents.
- Checkout props.
- Receipt icons.

### Garden puzzle

- Matcha, strawberries, milk, blueberries, oat, coconut, syrup, and vanilla tiles.
- Selection ring.
- Hint ring.
- Match burst.
- Harvest fly token.
- Low-move and no-move callouts.

## D. Export requirements

- Transparent sprites must have clean alpha with no colored halo.
- Use consistent canvas padding within each asset family.
- Record the ground line and pivot for every world sprite.
- Record native scene scale, not only pixel dimensions.
- Provide day and evening variants only when a lighting overlay cannot produce a convincing result.
- Do not bake drop shadows into sprites unless the shadow belongs to the object itself. Export contact shadows separately.
- UI SVGs should use `currentColor` where color changes by state.
- Avoid live text inside exported SVG assets.
- Flattened background plates must exclude characters and HUD.
- Animation atlases need a frame map, frame size, playback rate, loop rule, and pivot.
- Every export needs a clear name using `scene_object_state_view_scale`.

## E. Proposed naming examples

```text
counter_stall_base_cleaned_day.webp
counter_stall_base_cleaned_evening.webp
park_tree_cherry_large_day.png
park_tree_cherry_large_evening.png
character_mrs-sato_counter_happy.png
character_mrs-sato_portrait_neutral.png
decor_string-lights_world_day.png
decor_string-lights_world_lit.png
drink_iced-matcha_glass_finished.png
ui_icon_currency-coin.svg
ui_button_primary_default.svg
garden_tile_matcha_default.png
garden_tile_matcha_selected.png
```

## F. Asset catalog fields for the next step

Every asset record should contain:

- Asset ID.
- Display name.
- Category.
- Scene.
- Subscene or screen.
- Purpose.
- Camera family.
- Perspective.
- Master file.
- Runtime export.
- Dimensions.
- Pivot.
- Ground line.
- Occlusion layer.
- Day or evening state.
- Progression state.
- Interaction state.
- Animation state.
- Palette family.
- Light direction.
- Current source or replacement source.
- Approval status.
- Notes and dependencies.

---

# Scene-to-asset dependency summary

| Scene | Background | Environment sprites | Characters | Main HUD | Special states |
|---|---|---|---|---|---|
| Title garden | Garden cover | Petals, foreground foliage | Optional Mika art | Title, intro, start | Desktop and mobile crops |
| Service counter | Day or evening café plate | Counter tools, bowl, glass, decorations | Customer, approaching guest | Order, actions, quality, coins | Waiting, serving, win, unavailable |
| Village park | Day or evening park plate | Stall, trees, lamps, seats, garden, grocery | Mika, residents, dog | Profile, clock, coins, prompts | Day, evening, stall stages |
| Grocery | Real-time aisle | Shelves, packages, cart, checkout | Keeper | Wallet, receipt, prompt | Picked, paid, insufficient funds |
| Garden puzzle | Garden or modal base | Ingredient tiles, particles | None required | Moves, inventory, purchase | Selected, matched, low moves, empty |
| Rest views | Six POV plates | Minimal foreground props | Optional distant residents | Navigation | Three locations, day and night |
| Menus | Parchment panel system | Recipe and upgrade thumbnails | Portraits where needed | Tabs, buttons, meters, tables | Locked, owned, low stock, selected |

# Immediate next production step

Build a visual asset catalog from this inventory. Start with one row per current file, connect each file to the scenes above, then mark it `keep`, `redraw`, `re-render`, `split into layers`, or `remove`. Only after that audit should new assets be generated or illustrated. Otherwise the project will produce more art without fixing the existing inconsistency.
