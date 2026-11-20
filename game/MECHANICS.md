# Matcha cafe mechanics

- **Point of view:** fixed barista POV behind the counter. The customer waits across the counter, idles in the background, and displays the requested drink in a picture bubble. The barista and physical interactions remain unseen.
- **Orders:** each new customer alternates Traditional Hot Matcha and Iced Matcha Latte. Each recipe has its own step count, action icons, order image, status copy, and visual cues.
- **Visual preparation:** every action row has a looping illustrated GIF. Gauge steps also show the active action larger above the timing control, with before/after artwork that makes the ingredient change readable.
- **Whisk:** hold the action in the rhythm interaction and press Space when the moving marker crosses the sage target. Accuracy contributes to Order Quality.
- **Precision finish:** stop the moving line inside the narrow green zone, then hold until the circular arc completes at the target mark and release. The arc clamps exactly on target; accuracy contributes to Order Quality.
- **HUD feedback:** Order Quality sits in the top HUD. When quality changes, an animated guide travels from the active interaction toward the quality gauge and indicates an increase or decrease. On success, coins travel to the coin HUD; three stars add a tip. Status text and a result card report the outcome.
- **Customer variety:** five diverse illustrated customers cycle through the queue, each with an individual idle motion.
- **Inputs:** click the current action or press its number key; Space controls timing; Enter begins; R starts the next order after service. Mouse/touch press and release works for the precision gauges.
- **Repeatability:** `?seed=N` makes initial customer and recipe selection reproducible. `window.__game.state` exposes phase, step, recipe, customer, score, quality, coins, and gauge values for playthrough recording.

Meshy 7.1 generated and rigged the barista from the original Woman.png reference. The first pass was rejected for mismatched limb lengths. The second pass enabled T-pose and symmetry, targeted 6,500 triangles, and returned a 6,698-triangle mesh and separate walk and run clips. The shipped model uses the shared game clips and a reduced 768 px texture.

## Cherry Blossom Park

After serving, choose **Explore the park**. Use the arrow keys, WASD, the D-pad, or tap a location. Grass and paths are walkable. Tap destinations route around buildings, the garden fence, and larger props. **E** or the nearby button activates an interaction.

The barista has a shorter stride and a closer arm swing. Five textured Meshy T-pose meshes were generated from the customer lineup and cast as the park residents. Repeat appearances use independent copies of the rig. The football players reuse smaller copies of the blue-shirt and rose-shirt characters. All humanoids use the game's shared animation clips. The dog has its own quadruped rig.

## Village day

The village clock starts at 9:30 AM and advances three game minutes per active second. Day and time continue across the park and counter. Both views blend into dedicated evening artwork as lanterns brighten. Sunrise reverses the transition and the day advances at midnight. For lighting previews, add `?hour=6`, `?hour=18.5`, or `?hour=21` to the game URL.

The HUD shows the real coin balance and mean quality of completed orders as customer satisfaction. Before the first order it displays “First shift.” Ten additional Meshy visitors rotate through the village in pairs, alternating with the dog walker's outings and quiet intervals. The park admits at most eight characters including Mika and the dog. Nearby villagers can be greeted in their current activity.

The village and counter share a staffed cart and a single arriving customer. Opening the counter waits for an active pedestrian, who walks to the cart before ordering. When Mika steps outside, the sign closes and the customer rejoins their outing. On returning via the cart, the walk-up continues across the change to first person. The profile meter measures progress toward the next level (five completed orders). Customer satisfaction is shown separately.
