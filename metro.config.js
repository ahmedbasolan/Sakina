const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'mp3',
  'wav',
  'aac',
  'ogg',
  'm4a',
);

// Keep Metro's crawler/watcher out of the AI-tool workspaces that live in the
// repo root (.agents, .claude, .cursor, …). They contain no app code, the
// .claude worktrees carry whole duplicate node_modules trees, and their dirs
// get created/deleted while Metro is mid-crawl — which crashed the bundler
// with ENOENT (watch on a vanished .agents/skills folder).
const toolDirsBlock =
  /[\\/]\.(agent|agents|claire|claude|codebuddy|codex|continue|cursor|fallow|gemini|kiro|opencode|qoder|roo|trae|windsurf)[\\/]/;
const prevBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(prevBlockList) ? prevBlockList : prevBlockList ? [prevBlockList] : []),
  toolDirsBlock,
];

module.exports = config;
