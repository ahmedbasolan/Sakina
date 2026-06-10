const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'mp3',
  'wav',
  'aac',
  'ogg',
  'm4a',
);

module.exports = config;
