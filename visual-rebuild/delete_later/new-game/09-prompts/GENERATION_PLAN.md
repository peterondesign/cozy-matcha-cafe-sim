# Seedream 5 Pro Generation Plan

Model: `bytedance/seedream-5-pro`  
Output format: PNG  
Primary resolution: 2K  
Layer extraction: `layer_decomposition: true`

## Visual lock

Use the approved first game screen as the sole composition and style reference. Preserve its warm hand-painted anime storybook style, clean dark-brown outlines, honey timber, sage fabric, cream ceramics, blossom pink accents, soft morning sunlight, slightly textured paint, straight-on first-person café counter camera, and 16:9 composition. Never introduce photography, 3D rendering, hard cel shading, glossy plastic, modern appliances, UI panels, captions, watermarks, or unrelated objects.

## Pass 01: Decompose the approved screen

Input: `00-source/first-game-screen.webp`

Prompt:

> Decompose this game screen into the maximum useful editable layers. Separate the complete empty environment plate, foreground counter, roof and timber frame, green noren curtain, paper lantern, cherry blossom branches, open sign, customer character, speech bubble, speech text, drink-order illustration, matcha tin, bamboo whisk, sieve, empty chawan, empty tall glass, kettle, ice bowl, milk bottle, oat milk bottle, steam, loose petals, and shadows. Preserve every pixel of the original composition. Return clean transparent PNG layers with accurate bounds and stacking order.

## Pass 02: Empty daytime environment

Prompt:

> Using the reference screen, create the identical 16:9 café view with the exact same camera, architecture, garden, bridge, path, pond, blossoms, timber, noren curtain, counter, palette, and morning light. Remove the customer, speech bubble, order image, text, open sign, all tools, all containers, all ingredients, all bottles, all bowls, all glasses, all steam, and every loose foreground object. Leave a clean empty café structure and bare wooden work counter. No text. No people. No UI.

## Pass 03: Empty nighttime environment

Prompt:

> Create the exact same empty café environment and pixel-aligned composition as the daytime reference, now at peaceful blue-hour night. Preserve all architecture and object positions. Use deep forest-green shadows, muted blue sky, soft moonlight, warm paper-lantern glow, subtle garden lanterns, and delicate reflections in the pond. No customer, speech bubble, order image, text, sign, tools, containers, ingredients, bottles, bowls, glasses, steam, or UI.

## Pass 04: Empty cart and counter kit

Prompt:

> Isolate the café cart and counter assembly from the reference as clean transparent PNG layers. Include the timber counter top, counter front, side shelves, central preparation mats, left tool tray, right ingredient tray, roof beams, noren curtain, paper lantern, and hanging sign supports. Remove the customer, garden background, speech bubble, text, drink image, all tools, all ingredients, all containers, all bottles, all bowls, all glasses, steam, flowers, and loose petals. Keep exact reference perspective and 16:9 placement.

## Pass 05: Speech bubble

Prompt:

> Isolate only the cream speech bubble from the reference as a transparent PNG. Preserve its dark tea-brown hand-drawn outline, rounded organic shape, lower-left tail, subtle cream paper texture, and gentle shadow. Remove all words, drink illustrations, flowers, emphasis marks, customer, and background. Center the complete bubble with generous transparent padding.

## Pass 06: Drink order icons

Generate isolated transparent PNG still lifes for:

1. Traditional Hot Matcha in a chawan.
2. Iced Matcha Latte.
3. Oat Matcha Latte.
4. Vanilla Oat Matcha Latte.
5. Strawberry Coconut Matcha.
6. Blueberry Honey Matcha.

Shared prompt:

> Create one isolated drink-order icon matching the approved screen exactly: warm hand-painted anime storybook game art, clean brown outline, cream highlight, restrained sage and matcha palette, readable at 96 pixels. Show only the finished drink, straight-on three-quarter product view, no hands, no text, no badge, no speech bubble, no flowers, no background, transparent PNG, centered with even padding and a subtle separate contact shadow.

## Pass 07: Recipe action sheets

Each generation is one 4 by 4 grid. The cells must be equal, ordered left-to-right then top-to-bottom, and use an identical camera, work surface, hand design, tool scale, lighting, and crop. No cell borders, numbers, labels, captions, or text. Generate with a solid flat cream separation background, then run layer decomposition to extract every cell or action element. The final runtime sequence uses six selected frames per action.

### Shared action-sheet prefix

> Create a precise 4 by 4 animation sprite sheet for a cozy matcha café game. Sixteen equal sequential frames, ordered left-to-right and top-to-bottom. Show one continuous physical action from its untouched starting state to its complete final state. Fixed close-up camera above the same honey-wood counter. Same cream ceramic ware, same feminine barista hands in sage kimono sleeves, same soft morning light, same scale, same shadows, same warm hand-painted anime storybook style as the reference. Keep every object inside its cell. No cell borders, no text, no numbers, no labels, no UI. Flat uniform cream background suitable for layer extraction.

### Traditional Hot Matcha actions

- Warm the chawan: empty bowl, hot water poured in, bowl rotated, water discarded, bowl wiped dry.
- Sift matcha: measured powder enters sieve, sieve tapped, fine powder falls, smooth powder mound forms.
- Add hot water: kettle approaches, controlled stream enters powder, green suspension forms.
- Whisk to fine foam: chasen enters, fast W motion, bubbles tighten, fine jade foam forms.
- Serve chawan: finished bowl rotated and presented, steam settles into final pose.

### Iced Matcha Latte actions

- Choose tall glass: hand reaches, grips clean glass, lifts, centers it on the mat.
- Add ice: ice bowl tilts, cubes fall progressively, glass fills to the correct line.
- Pour cold milk: bottle tilts, white stream rises through ice, stops below the rim.
- Sift matcha: measured powder becomes a smooth mound in a small bowl.
- Add hot water: controlled kettle stream wets the sifted powder.
- Whisk matcha: chasen creates a smooth vivid green concentrate.
- Layer matcha: green matcha pours over milk and ice, forming a distinct upper layer.

### Oat Matcha Latte actions

- Choose tall glass.
- Add ice.
- Pour oat milk, visibly warm beige rather than white.
- Sift matcha.
- Add hot water.
- Whisk matcha.
- Layer matcha over oat milk.

### Vanilla Oat Matcha actions

- Choose tall glass.
- Add measured vanilla drops.
- Add ice.
- Pour oat milk.
- Sift matcha.
- Add hot water.
- Whisk matcha.
- Layer matcha.

### Strawberry Coconut Matcha actions

- Choose tall glass.
- Add sliced strawberries.
- Mash strawberries into a textured pink-red base.
- Add ice.
- Pour coconut milk.
- Sift matcha.
- Add hot water.
- Whisk matcha.
- Layer matcha over strawberry and coconut milk.

### Blueberry Honey Matcha actions

- Choose tall glass.
- Add blueberries.
- Mash blueberries into a deep violet base.
- Add honey and stir it into the berries.
- Add ice.
- Pour milk.
- Sift matcha.
- Add hot water.
- Whisk matcha.
- Layer matcha over the blueberry base and milk.

## Layer decomposition prompt for every action sheet

> Decompose this 4 by 4 sprite sheet into sixteen separate full-cell image layers in reading order, left-to-right and top-to-bottom. Preserve the exact frame contents and crop. Name layers `frame_01` through `frame_16`. Also separate hands, tool, vessel, ingredient, liquid or particle effect, and contact shadow when possible. Return transparent PNG layers with stacking order and accurate bounds.

## Frame selection rule

Select six frames per action:

1. Anticipation or untouched start.
2. Contact or first visible change.
3. Early action.
4. Midpoint.
5. Near-complete action.
6. Settled final state.

Do not select frames with malformed hands, changing vessel shape, incorrect object count, changing camera, broken liquid continuity, or inconsistent shadows.

## Runtime naming

```text
recipe_action_01_start.png
recipe_action_02_contact.png
recipe_action_03_early.png
recipe_action_04_mid.png
recipe_action_05_near-complete.png
recipe_action_06_final.png
```

