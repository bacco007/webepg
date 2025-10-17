"use strict";
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0, "always"],
    "footer-max-line-length": [0, "always"],
    "references-empty": [1, "never"],
  },
};

module.exports = config;
