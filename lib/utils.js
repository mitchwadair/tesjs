// Copyright (c) 2020-2022 Mitchell Adair
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

module.exports = {
    objectShallowEquals: (obj1, obj2) => {
        let isEq = Object.entries(obj1).every(([key, value]) => {
            if (!(key in obj2) || value !== obj2[key]) {
                return false;
            }
            return true;
        });
        if (isEq) {
            isEq = Object.entries(obj2).every(([key, value]) => {
                if (!(key in obj1) || obj1[key] !== value) {
                    return false;
                }
                return true;
            });
        }
        return isEq;
    },
    printObject: (obj) => {
        return JSON.stringify(obj);
    },
};
