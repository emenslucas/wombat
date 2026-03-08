import { sql } from "../lib/db.js";

// Script to update durations for tracks that don't have them
async function updateDurations() {
  try {
    // Get all tracks without duration
    const tracks = await sql`
      SELECT id, blob_url FROM tracks WHERE duration IS NULL
    `;

    console.log(`Found ${tracks.length} tracks without duration`);

    for (const track of tracks) {
      try {
        // Create audio element to get duration
        const duration = await new Promise((resolve, reject) => {
          const audio = new Audio(track.blob_url);
          audio.addEventListener("loadedmetadata", () => {
            resolve(Math.floor(audio.duration));
          });
          audio.addEventListener("error", () => {
            reject(new Error("Failed to load audio"));
          });
          // Timeout after 10 seconds
          setTimeout(() => reject(new Error("Timeout")), 10000);
        });

        // Update the track
        await sql`
          UPDATE tracks SET duration = ${duration} WHERE id = ${track.id}
        `;

        console.log(`Updated track ${track.id}: ${duration}s`);
      } catch (error) {
        console.error(`Failed to update track ${track.id}:`, error);
      }
    }

    console.log("Done updating durations");
  } catch (error) {
    console.error("Script error:", error);
  } finally {
    process.exit(0);
  }
}

updateDurations();
