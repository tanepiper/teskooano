import { init, createNearByGraph } from "@robertaron/spacial-partitioning";

/**
 * Simple test to verify WASM library is working
 */
export async function testWasmLibrary(): Promise<boolean> {
  try {
    console.log("Testing WASM library initialization...");

    // Test initialization
    await init();
    console.log("WASM library initialized successfully");

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

    console.log("WASM neighbor graph result:", neighborGraph);
    console.log("WASM library test passed!");

    return true;
  } catch (error) {
    console.error("WASM library test failed:", error);
    return false;
  }
}
