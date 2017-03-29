'use strict';

const _ = require('lodash');
const fs = require('fs');
const prompt = require('prompt');
const path = require('path');

exports.readOrPromptForKey = (file, keyOrKeyChain, promptMessage) => {
    return new Promise((resolve, reject) => {
        file = path.resolve(file);
        const keys = JSON.parse(fs.readFileSync(file, 'utf-8'));
        const foundKey = _.get(keys, keyOrKeyChain);
        if (foundKey) {
            resolve(foundKey)
        } else {
            //Write the given key to the file so it's not asked again
            prompt.start();
            prompt.get([{
                name: 'key',
                description: promptMessage
            }], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    fs.writeFileSync(file, JSON.stringify(_.merge({}, keys, _.set({}, keyOrKeyChain, result.key))));
                    resolve(result.key);
                }
            });
        }
    });
};