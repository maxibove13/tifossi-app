import { createVideoPlayer, VideoPlayer } from 'expo-video';

/**
 * Simple cache for pre-buffered VideoPlayer instances.
 * Videos start buffering as soon as a player is created, even without a VideoView.
 */
class VideoCache {
  private players: Map<string, VideoPlayer> = new Map();

  /**
   * Preload videos by creating VideoPlayer instances that start buffering.
   */
  preload(sources: string[]): void {
    for (const source of sources) {
      if (this.players.has(source)) continue;

      try {
        const player = createVideoPlayer(source);
        player.muted = true;
        player.loop = true;
        this.players.set(source, player);
      } catch {
        // Failed to create player
      }
    }
  }

  /**
   * Get a pre-buffered player for a source, or undefined if not cached.
   */
  get(source: string): VideoPlayer | undefined {
    return this.players.get(source);
  }

  /**
   * Check if a source has a cached player.
   */
  has(source: string): boolean {
    return this.players.has(source);
  }

  /**
   * Release all cached players and clear the cache.
   */
  clear(): void {
    for (const player of this.players.values()) {
      try {
        player.release();
      } catch {
        // Ignore release errors
      }
    }
    this.players.clear();
  }
}

export const videoCache = new VideoCache();

// Default export to prevent Expo Router treating this as a route
export default videoCache;
