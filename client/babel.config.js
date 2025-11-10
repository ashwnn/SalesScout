module.exports = function(api) {
  const isDevelopment = api.env('development');
  
  return {
    presets: [
      ['@babel/preset-env', {
        modules: false,
        useBuiltIns: 'usage',
        corejs: 3,
        targets: isDevelopment ? { esmodules: true } : '> 0.25%, not dead'
      }],
      ['@babel/preset-react', { 
        runtime: 'automatic',
        development: isDevelopment 
      }],
      '@babel/preset-typescript'
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src'
          }
        }
      ],
      '@babel/plugin-transform-runtime',
      ...(isDevelopment ? [] : [
        ['transform-remove-console', { exclude: ['error', 'warn'] }]
      ])
    ]
  };
};