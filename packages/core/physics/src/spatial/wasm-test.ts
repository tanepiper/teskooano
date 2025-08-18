import { init, createNearByGraph } from "@robertaron/spacial-partitioning";

/**
 * Simple test to verify WASM library is working
 */
export async function testWasmLibrary(): Promise<boolean> {
  try {
    // Test initialization
    await init();

    // Test basic functionality
    const positions = new Float32Array([
      0,
      0,
      0, // Point 1
      1,
      0,
      0, // Point 2
      0,
      1,
      0, // Point 3
    ]);

    const distance = 2;
    const neighborGraph = createNearByGraph(positions, distance);

    return neighborGraph.length > 0;
  } catch (error) {
    return false;
  }
}
