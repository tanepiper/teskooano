OK I've figure it out - where the mis-understanding has been this whole time is in not defining the clear requirements of the new engine we're building, and how @celestials is quite clearly a major part of it.

If I explain it how I see it, then try refine it into clear requirements:

We currently have a frontend were the user provide a string seed, this is then used with a procedural generation library that takes this value, and uses it with a set of rules to generate a random system, made up of different celestial types, each with their own qualities

- Requirement: create a document in markdown, clearly explaining step by step the different rules in procedural generation currently used, this includes the initial data, but also the celestial generation

- Requirement: Come up with a clear matrix of the current enum combinations for celetial objects based on the data types

The next steps are a bit fuzzy for me, but I'll try explain - so once the data has been generated, we pass this to a factory function that creates a solar system with these bodies, and this creates the initial celestial state for each body, we then also start the simulation - this is a different state that is more realtime and only holds the calculations from the physics engine about bodies

We then have a layer that facades the physics layer to the ThreeJS layer, it then has a modular renderer that handles the scene, camera, lighting, etc - in our app, we can have multiple renderers pointing at different celestials, but using the same simulation and celestial data - allowing for multiple views

The celestials are created by a factory that uses the celestial type to pick a particular renderer (star, planet, gas giant, moon, etc) and then subtypes of these, which then creates a LOD-derived sphere, applys a GPU texture to it, adds rings, clouds and atmospheres.

I'm not sure in what direction data goes, but my gut feeling is everything should derive from THE CELESTIAL as the abstraction to the state, physics engine and the renderer - why?

We have an initial state, and we put that into a nanostore - but then just fire out subscriptions on this everywhere, which makes things messy.  Instead, if we went the route of connecting state to a celestial object, then we can use it in different strategies to define certain things.  Here are some facts.

1. When the physics state calls things - we can have rules like planets and moons are only affected by stars, parents and other celestials within a certain distance (e.g. 2 AU) that help optimise the calculations

2. Celestials can check if they are being rendered, and they they need to calculate things (for example, off screen items only need to calculate real state, not 3d state until they are rendered on the screen again - also we can maybe debounce/throttle their calculations a bit more to help performance)

3. When a user focuses on a Celestial, we call data from the celestial store related to it's properties, we also want to then subscribe to it's state only from the global state to display in another panel

In terms of refactoring, I don't want to overload the celestial module, so we can still keep a facade to it, but I want you to really think about this one, as a senior dev - this is serious


Requirements:

- Keep simplifying our type model, even if that means making more types and factories to simplify creation of different things in the long run, but also think about the complexity - we are creating only celestials which at the basic level are fundamentally all the same

- If you see things like multiple scalings or calculations of similar values, point them out - we want to reduce the number of places code is called, especially if we can optimise on the CPU

- Think about the Celestial abstraction, where each celestial object is responsible for it's own lifecycle, data and rendering - leaving the engine to just be a tool to collect each one in different groupings (like whole syste, on-screen, or within a certain distance) and call methods that allow it to do as it does now - work with hightly accurate physics to give a great visualisation of multiple bodies.

Essentially we move to a model of Celestial as sort of "Plugin" abstraction, we are just giving for each Celestial a seed of data, which the system then extracts and mutates as needed, providing it back as a single layer to read in any part of the system that subscribes - we have both the procedural way of doing it, but will also provide methods to create systems via code or JSON.

Are you up to the task?

