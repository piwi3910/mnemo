import type { FileNode } from "./api";

export function collectNoteNames(nodes: FileNode[]): Set<string> {
  const names = new Set<string>();
  for (const node of nodes) {
    if (node.type === "file") {
      names.add(node.name.replace(/\.md$/, "").toLowerCase());
      names.add(node.path.replace(/\.md$/, "").toLowerCase());
    }
    if (node.children) {
      for (const name of collectNoteNames(node.children)) {
        names.add(name);
      }
    }
  }
  return names;
}

export function collectNotePaths(nodes: FileNode[]): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    if (node.type === "file") {
      paths.push(node.path.replace(/\.md$/, ""));
    }
    if (node.children) {
      paths.push(...collectNotePaths(node.children));
    }
  }
  return paths;
}
