# TODO

- **Testing:** Add comprehensive unit tests (`.spec.ts`) for `ControlsManager` and `CSS2DManager`, covering:
  - `ControlsManager`: Transitions, following logic, state updates, edge cases (cancelling transitions, rapid changes).
  - `CSS2DManager`: Element creation, removal, layer visibility, orphan checking, position calculations (especially Oort Cloud).
- **`ControlsManager` Debug Mode:** Flesh out or remove the `setDebugMode` functionality if FlyControls aren't planned.
- **`CSS2DManager` Custom Elements:** Review the purpose and usage of `createCustomElement` if it's still needed or if specific methods cover all use cases.
- **Error Handling:** Add more robust error handling and logging, especially around DOM interactions and potential missing parent objects.
- **Performance:** Profile `CSS2DManager` label updates, especially with many objects, and optimize if needed.
- **Documentation:** Add JSDoc comments to all public methods and properties in both managers.
