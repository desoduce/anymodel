module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Enable the polyfill for import.meta to support PDF.js
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: []
  };
};
