# TODO - @teskooano/core-math

- [x] **Fix Inconsistent Decoupling from `three`**:

  - The `OSVector3.ts` file directly imports `THREE.Quaternion`, creating a hard dependency on the `three` library which is not declared in `package.json`.
  - **Long-term Fix**: Create a custom `OSQuaternion` class within this package to remove the direct `three` import, achieving true renderer-agnosticism.
  - **Short-term Fix**: Add `three` as a `peerDependency` in `package.json` to make the dependency explicit.

- [ ] **Audit Test Suites for Type Correctness**:

  - Some tests in dependent packages use `THREE.Vector3` where `OSVector3` is expected.
  - Perform a full audit of test suites across all core packages to ensure they exclusively use `OSVector3` when interacting with functions that expect it to enforce type safety.

- [x] **Add More Vector Operations**: Added `lerp`, `angleTo`, `projectOnVector`, and `reflect`.
- [x] **Quaternion Implementation**: Basic `OSQuaternion` class created with `clone`, `set`, `copy`, and `setFromAxisAngle`.
- [x] **Implement Full Quaternion Math**: Flesh out the `OSQuaternion` class with multiplication, inversion, slerp, and other common quaternion operations.
- [x] **Matrix Implementation**: Consider adding `OSMatrix3` and `OSMatrix4` if complex transformations beyond quaternions are required internally.
- [x] **Performance**: Profile vector operations if they become a bottleneck. Refactored `OSMatrix4.multiply` and `OSMatrix4.lookAt` to be allocation-free.
- [x] **Testing**: Ensure comprehensive test coverage for all `OSVector3`, `OSQuaternion`, `OSMatrix3` and `OSMatrix4` methods.
- [ ] **Fix Moon Runner**: Investigate why `moon run math:test` is failing and correct the project configuration.
- [ ] **Documentation**: Add more detailed JSDoc comments to utility functions explaining edge cases or usage examples.
