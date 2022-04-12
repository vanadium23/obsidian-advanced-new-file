import { normalizePath } from "obsidian";

interface ParsedPath {
  /** The full directory path such as '/home/user/dir' or 'folder/sub' */
  dir: string;
  /** The file name without extension */
  name: string;
}

export const path = {
  /**
   * Parses a path string into directory and file name
   * Supports '/foo/bar/file' or '\foo\bar\file'
   */
  parse(path: string): ParsedPath {
    const regex = /(?<dir>([^/\\]+[/\\])*)(?<name>[^/\\]*$)/;
    const match = normalizePath(path).match(regex);
    const { dir, name } = match?.groups;
    return { dir, name };
  },
  /**
   * Joins multiple strings into a normalized path
   */
  join(...strings: string[]): string {
    const parts = strings.map((s) => s.trim()).filter((s) => s != null);
    // TODO: Test on windows
    // I'm not sure if `normalizePath` will automatically convert `/` to `\`
    // on windows.
    return normalizePath(parts.join("/"));
  },
};
