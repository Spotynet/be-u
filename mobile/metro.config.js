const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom Metro configuration here
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;



