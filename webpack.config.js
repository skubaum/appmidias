const webpack = require('@nativescript/webpack');

module.exports = (env) => {
  webpack.init(env);

  env.appComponents = (env.appComponents || []).concat([
    './app/service',
    './app/alarm-receiver'
  ])
  return webpack.resolveConfig();
};
