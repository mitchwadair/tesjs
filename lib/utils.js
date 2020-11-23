// Copyright (c) 2020 Mitchell Adair
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const https = require('https');

module.exports = {
    request: (method, url, headers = {}, body = {}) => {
        return new Promise((resolve, reject) => {
            const opts = {
                headers: headers,
                method: method,
            }
            const reqBody = JSON.stringify(body);
            const req = https.request(url, opts, res => {
                let data = [];
                res.on('error', err => {
                    reject(err)
                }).on('data', chunk => {
                    data.push(chunk);
                }).on('end', _ => {
                    const dataStr = Buffer.concat(data).toString()
                    try {
                        data = JSON.parse(dataStr);
                    } catch (e) {
                        data = dataStr;
                    }
                    if (data.error)
                        reject(data);
                    else
                        resolve(data);
                });
            });
            req.on('error', err => {
                reject(err);
            });
            if (method === 'POST') {
                req.write(reqBody);
            }
            req.end();
        })
    },
    objectShallowEquals: (obj1, obj2) => {
        let isEq = true;
        Object.keys(obj1).every(key => {
            if (!(key in obj2) || obj1[key] !== obj2[key]) {
                isEq = false;
                return false;
            }
            return true;
        });
        if (isEq) {
            Object.keys(obj2).every(key => {
                if (!(key in obj1) || obj1[key] !== obj2[key]) {
                    isEq = false;
                    return false;
                }
                return true;
            });
        }
        return isEq;
    }
}