/**
 * Configuration options for TeskooanoApp initialization
 */
export interface TeskooanoAppOptions {
  /** Array of plugin IDs to load */
  pluginIds: string[];
  /** Application name (defaults to "Teskooano") */
  appName?: string;
  /** Application version (defaults to "unknown") */
  version?: string;
  /** Git hash for build tracking (defaults to "unknown") */
  gitHash?: string;
}
