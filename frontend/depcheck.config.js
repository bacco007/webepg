module.exports = {
  ignoreMatches: [
    // deps that are used dynamically or by CLIs
    // e.g. 'webpack-cli', 'rimraf'
  ],
  ignorePatterns: ["dist", "build", "coverage"],
  // files to scan (default covers most cases)
  // specials help detect usage in configs/plugins
  specials: [
    require("depcheck/dist/special/eslint"),
    require("depcheck/dist/special/babel"),
    require("depcheck/dist/special/webpack"),
    require("depcheck/dist/special/tslint"), // if applicable
    require("depcheck/dist/special/typescript"),
  ],
};
