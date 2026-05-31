module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        // safe: true would require all keys declared in .env.example to exist.
        // allowUndefined: false makes missing keys a build-time error rather
        // than silently resolving to undefined (which caused mysterious RLS
        // failures when SUPABASE_URL was missing from a CI environment).
        safe: false,
        allowUndefined: false,
      }],
    ],
  };
};
