// Copyright (c) 2021 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// This is a Webpack loader that just returns nothing to exclude a file from the bundle
module.exports = function () {
    this.cacheable && this.cacheable();
    return "";
};
