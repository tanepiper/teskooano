# Celestial Icons

This is a shared package based on the current logic in the celestial hierachy for rendering icons for celestials - i want to make it more generic and also extend it:

- Provide more accurate and varied main star icons
- For different star classes, provide a more appropriate icon
- More accurate and varied terrestrials
- More accurate and varied gas giants
- if the planet has rings, then render a ring around it
- if the planet has an atmostphere, have a light atmosphere around it
- have icon modifers for different effects (can implement later)

essentially every BaseCelestialRenderer should provide a configuration to this, and then the CelestialRowComponent can use it to show the correct icon
