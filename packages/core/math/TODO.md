# TODO - @teskooano/core-math

- [ ] **Add More Vector Operations**: Consider adding common operations like `lerp`, `angleTo`, projection, reflection to `OSVector3` if needed by physics or simulation.
- [ ] **Quaternion Implementation**: Evaluate if a custom `OSQuaternion` class is needed or if using `THREE.Quaternion` directly (passed in) is sufficient.
- [ ] **Matrix Implementation**: Consider adding `OSMatrix3` and `OSMatrix4` if complex transformations beyond quaternions are required internally.
- [ ] **Performance**: Profile vector operations if they become a bottleneck.
- [ ] **Testing**: Ensure comprehensive test coverage for all `OSVector3` methods and utility functions (looks like utils has tests, need to check OSVector3).
- [ ] **Documentation**: Add more detailed JSDoc comments to utility functions explaining edge cases or usage examples.
