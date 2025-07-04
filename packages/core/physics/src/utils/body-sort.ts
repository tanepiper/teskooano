import type { PhysicsStateReal } from "@teskooano/data-types";

/**
 * Sorts an array of celestial bodies based on their orbital hierarchy, ensuring
 * that parent bodies are processed before their children. This is crucial for
 * "on-rails" integrators where a child's position depends on the parent's
 * final position for the current frame.
 *
 * @param bodies - An array of all PhysicsStateReal bodies in the simulation.
 * @param parentIds - A map of child object ID to parent object ID.
 * @returns A new array of PhysicsStateReal bodies, sorted by hierarchy.
 */
export const sortBodiesByHierarchy = (
  bodies: PhysicsStateReal[],
  parentIds: Map<string | number, string | number | undefined>,
): PhysicsStateReal[] => {
  const bodyMap = new Map(bodies.map((b) => [b.id, b]));
  const adj = new Map<string | number, (string | number)[]>();
  const inDegree = new Map<string | number, number>();

  for (const body of bodies) {
    adj.set(body.id, []);
    inDegree.set(body.id, 0);
  }

  for (const body of bodies) {
    const parentId = parentIds.get(body.id);
    if (parentId && adj.has(parentId)) {
      adj.get(parentId)!.push(body.id);
      inDegree.set(body.id, (inDegree.get(body.id) || 0) + 1);
    }
  }

  const queue: (string | number)[] = [];
  for (const body of bodies) {
    if (inDegree.get(body.id) === 0) {
      queue.push(body.id);
    }
  }

  const sortedBodyIds: (string | number)[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    sortedBodyIds.push(u);

    for (const v of adj.get(u) || []) {
      inDegree.set(v, (inDegree.get(v) || 0) - 1);
      if (inDegree.get(v) === 0) {
        queue.push(v);
      }
    }
  }

  if (sortedBodyIds.length !== bodies.length) {
    console.warn(
      "Cycle detected in orbital hierarchy, or some bodies were not sorted. Returning original order.",
    );
    return bodies; // Fallback in case of cycle
  }

  return sortedBodyIds.map((id) => bodyMap.get(id as string)!);
};
