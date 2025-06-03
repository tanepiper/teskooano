import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialType,
  CelestialPhysicsState,
} from "@teskooano/celestial-object";
import {
  Collision,
  DestructionEvent,
  MASS_DIFF_THRESHOLD,
  MUTUAL_DESTRUCTION_ID,
} from "./collision-types";

/**
 * Resolves a detected collision between two bodies using the principles of elastic collision.
 * Calculates and applies impulses to conserve momentum and kinetic energy (based on restitution).
 * Operates directly on the `CelestialPhysicsState` objects.
 *
 * @param collision - The detailed collision information obtained from `detectSphereCollision`.
 * @param body1State - The complete `CelestialPhysicsState` of the first body.
 * @param body2State - The complete `CelestialPhysicsState` of the second body.
 * @returns A tuple containing the two updated `CelestialPhysicsState` objects `[newState1, newState2]` after applying the collision impulse.
 */
export const resolveCollision = (
  collision: Collision,
  body1State: CelestialPhysicsState,
  body2State: CelestialPhysicsState,
): [CelestialPhysicsState, CelestialPhysicsState] => {
  const { normal, relativeVelocity } = collision;
  const mass1 = body1State.mass_kg;
  const mass2 = body2State.mass_kg;

  if (mass1 <= 0 || mass2 <= 0) {
    console.warn(
      `Collision resolution skipped between ${body1State.id} and ${body2State.id}: Invalid mass (<= 0).`,
    );
    return [body1State, body2State];
  }

  const normalVelocity = relativeVelocity.dot(normal);

  if (normalVelocity > 0) {
    return [body1State, body2State];
  }

  const restitution = 1.0;

  const j = (-(1 + restitution) * normalVelocity) / (1 / mass1 + 1 / mass2);

  const impulseVector = normal.clone().multiplyScalar(j);

  const newVelocity1_mps = body1State.velocity_mps
    .clone()
    .add(impulseVector.clone().multiplyScalar(1 / mass1));

  const newVelocity2_mps = body2State.velocity_mps
    .clone()
    .sub(impulseVector.clone().multiplyScalar(1 / mass2));

  const newBody1: CelestialPhysicsState = {
    ...body1State,
    velocity_mps: newVelocity1_mps,
  };

  const newBody2: CelestialPhysicsState = {
    ...body2State,
    velocity_mps: newVelocity2_mps,
  };

  return [newBody1, newBody2];
};

/** Helper function to check if a type is a planet, dwarf planet, or moon */
export const isPlanetOrMoon = (type: CelestialType): boolean => {
  return (
    type === CelestialType.PLANET ||
    type === CelestialType.DWARF_PLANET ||
    type === CelestialType.MOON
  );
};

/**
 * Handles an inelastic collision where one body (survivor) absorbs another (destroyed).
 * Conserves momentum, updates survivor state, marks destroyed ID, and creates an event.
 */
export const handleInelasticAbsorption = (
  survivorId: string | number,
  destroyedId: string | number,
  updatedBodiesMap: Map<string | number, CelestialPhysicsState>,
  destroyedIds: Set<string | number>,
  destructionEvents: DestructionEvent[],
  radii: Map<string | number, number>,
): void => {
  if (destroyedIds.has(survivorId) || destroyedIds.has(destroyedId)) {
    return;
  }

  const survivor = updatedBodiesMap.get(survivorId);
  const destroyed = updatedBodiesMap.get(destroyedId);
  const destroyedRadius = radii.get(destroyedId);

  if (!survivor || !destroyed || destroyedRadius === undefined) {
    console.warn(
      `[handleInelasticAbsorption] Could not find states/radius for survivor ${survivorId} or destroyed ${destroyedId}`,
    );
    if (destroyedId) destroyedIds.add(destroyedId);
    return;
  }

  const relativeVelocity = survivor.velocity_mps
    .clone()
    .sub(destroyed.velocity_mps);
  const impactPosition = destroyed.position_m.clone();

  destructionEvents.push({
    survivorId,
    destroyedId,
    impactPosition,
    relativeVelocity,
    destroyedRadius,
  });

  const momentum1 = survivor.velocity_mps
    .clone()
    .multiplyScalar(survivor.mass_kg);
  const momentum2 = destroyed.velocity_mps
    .clone()
    .multiplyScalar(destroyed.mass_kg);
  const totalMomentum = momentum1.add(momentum2);
  const totalMass = survivor.mass_kg + destroyed.mass_kg;

  if (totalMass <= 0) {
    console.warn(
      `[handleInelasticAbsorption] Skipping inelastic collision between ${survivorId} and ${destroyedId}: Zero or negative total mass (${totalMass} kg).`,
    );
    destroyedIds.add(destroyedId);
    return;
  }

  const newVelocity = totalMomentum.multiplyScalar(1 / totalMass);

  updatedBodiesMap.set(survivorId, {
    ...survivor,
    mass_kg: totalMass,
    velocity_mps: newVelocity,
  });

  destroyedIds.add(destroyedId);
};

/** Handles collision between two stars (larger absorbs smaller). */
export const resolveStarCollision = (
  id1: string | number,
  id2: string | number,
  body1: CelestialPhysicsState,
  body2: CelestialPhysicsState,
  updatedBodiesMap: Map<string | number, CelestialPhysicsState>,
  destroyedIds: Set<string | number>,
  destructionEvents: DestructionEvent[],
  radii: Map<string | number, number>,
) => {
  if (body1.mass_kg >= body2.mass_kg) {
    handleInelasticAbsorption(
      id1,
      id2,
      updatedBodiesMap,
      destroyedIds,
      destructionEvents,
      radii,
    );
  } else {
    handleInelasticAbsorption(
      id2,
      id1,
      updatedBodiesMap,
      destroyedIds,
      destructionEvents,
      radii,
    );
  }
};

/** Handles collision where a star absorbs a non-star. */
export const resolveStarNonStarCollision = (
  starId: string | number,
  nonStarId: string | number,
  updatedBodiesMap: Map<string | number, CelestialPhysicsState>,
  destroyedIds: Set<string | number>,
  destructionEvents: DestructionEvent[],
  radii: Map<string | number, number>,
) => {
  handleInelasticAbsorption(
    starId,
    nonStarId,
    updatedBodiesMap,
    destroyedIds,
    destructionEvents,
    radii,
  );
};

/** Handles collision between two moons (mutual destruction). */
export const resolveMoonMoonCollision = (
  id1: string | number,
  id2: string | number,
  body1: CelestialPhysicsState,
  body2: CelestialPhysicsState,
  destroyedIds: Set<string | number>,
  destructionEvents: DestructionEvent[],
  radii: Map<string | number, number>,
) => {
  if (destroyedIds.has(id1) || destroyedIds.has(id2)) return;

  destroyedIds.add(id1);
  destroyedIds.add(id2);

  const radius1 = radii.get(id1);
  if (radius1 === undefined) {
    console.warn(`[resolveMoonMoonCollision] Missing radius for ${id1}`);
    return;
  }

  const relativeVelocity = body1.velocity_mps.clone().sub(body2.velocity_mps);
  destructionEvents.push({
    survivorId: MUTUAL_DESTRUCTION_ID,
    destroyedId: `${id1} & ${id2}`,
    impactPosition: body1.position_m.clone(),
    relativeVelocity: relativeVelocity,
    destroyedRadius: radius1,
  });
};

/** Handles elastic collision between Planet/Moon and Gas Giant. */
export const resolvePlanetGasGiantCollision = (
  id1: string | number,
  id2: string | number,
  body1: CelestialPhysicsState,
  body2: CelestialPhysicsState,
  collision: Collision,
  updatedBodiesMap: Map<string | number, CelestialPhysicsState>,
) => {
  const [resolvedBody1, resolvedBody2] = resolveCollision(
    collision,
    body1,
    body2,
  );
  updatedBodiesMap.set(id1, resolvedBody1);
  updatedBodiesMap.set(id2, resolvedBody2);
};

/** Handles general non-star collisions (elastic or inelastic based on mass ratio). */
export const resolveGeneralNonStarCollision = (
  id1: string | number,
  id2: string | number,
  body1: CelestialPhysicsState,
  body2: CelestialPhysicsState,
  collisionInfo: Collision,
  types: Map<string | number, CelestialType>,
  updatedBodiesMap: Map<string | number, CelestialPhysicsState>,
  destroyedIds: Set<string | number>,
  destructionEvents: DestructionEvent[],
  radii: Map<string | number, number>,
) => {
  const mass1 = body1.mass_kg;
  const mass2 = body2.mass_kg;

  const type1 = types.get(id1);
  const type2 = types.get(id2);

  // Determine if it's a significantly mass-imbalanced collision leading to absorption
  const largeMassDiff =
    mass1 < mass2 * MASS_DIFF_THRESHOLD || mass2 < mass1 * MASS_DIFF_THRESHOLD;

  // Special case: Gas Giant vs. Planet/Moon (elastic despite mass difference)
  const isGasGiantPlanetMoonCollision =
    (type1 === CelestialType.GAS_GIANT && isPlanetOrMoon(type2!)) ||
    (type2 === CelestialType.GAS_GIANT && isPlanetOrMoon(type1!));

  if (largeMassDiff && !isGasGiantPlanetMoonCollision) {
    // Inelastic: larger absorbs smaller
    if (mass1 > mass2) {
      handleInelasticAbsorption(
        id1,
        id2,
        updatedBodiesMap,
        destroyedIds,
        destructionEvents,
        radii,
      );
    } else {
      handleInelasticAbsorption(
        id2,
        id1,
        updatedBodiesMap,
        destroyedIds,
        destructionEvents,
        radii,
      );
    }
  } else {
    // Elastic collision for others or Gas Giant vs Planet/Moon
    const [resolvedBody1, resolvedBody2] = resolveCollision(
      collisionInfo,
      body1,
      body2,
    );
    updatedBodiesMap.set(id1, resolvedBody1);
    updatedBodiesMap.set(id2, resolvedBody2);
  }
};
