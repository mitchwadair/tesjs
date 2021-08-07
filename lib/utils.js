// Copyright (c) 2020 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

module.exports = {
    objectShallowEquals: (obj1, obj2) => {
        let isEq = Object.keys(obj1).every((key) => {
            if (!(key in obj2) || obj1[key] !== obj2[key]) return false;
            return true;
        });
        if (isEq) {
            isEq = Object.keys(obj2).every((key) => {
                if (!(key in obj1) || obj1[key] !== obj2[key]) return false;
                return true;
            });
        }
        return isEq;
    },
};
