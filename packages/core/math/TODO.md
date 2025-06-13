# TODO - @teskooano/core-math

- [x] **Fix Inconsistent Decoupling from `three`**:

  - The `OSVector3.ts` file directly imports `THREE.Quaternion`, creating a hard dependency on the `three` library which is not declared in `package.json`.
  - **Long-term Fix**: Create a custom `OSQuaternion` class within this package to remove the direct `three` import, achieving true renderer-agnosticism.
  - **Short-term Fix**: Add `three` as a `peerDependency` in `package.json` to make the dependency explicit.

- [ ] **Audit Test Suites for Type Correctness**:

  - Some tests in dependent packages use `THREE.Vector3` where `OSVector3` is expected.
  - Perform a full audit of test suites across all core packages to ensure they exclusively use `OSVector3` when interacting with functions that expect it to enforce type safety.

- [ ] **Add More Vector Operations**: Consider adding common operations like `lerp`, `angleTo`, projection, reflection to `OSVector3` if needed by physics or simulation.
- [ ] **Quaternion Implementation**: Evaluate if a custom `OSQuaternion` class is needed or if using `THREE.Quaternion` directly (passed in) is sufficient.
- [ ] **Matrix Implementation**: Consider adding `OSMatrix3` and `OSMatrix4` if complex transformations beyond quaternions are required internally.
- [ ] **Performance**: Profile vector operations if they become a bottleneck.
- [ ] **Testing**: Ensure comprehensive test coverage for all `OSVector3` methods and utility functions (looks like utils has tests, need to check OSVector3).
- [ ] **Documentation**: Add more detailed JSDoc comments to utility functions explaining edge cases or usage examples.
