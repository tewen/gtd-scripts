#!/usr/bin/env node

const fs = require('fs');
const moment = require('moment');
const _ = require('lodash');
const path = require('path');
const agent = require('superagent-promise')(require('superagent'), Promise);

//Lang Codes https://ctrlq.org/code/19899-google-translate-languages

if (process.argv.length >= 5) {

    //Args
    const apiKey = process.argv[2];
    const inputFile = process.argv[3];
    const destinationCodes = process.argv[4].split(',');

    const apiUrl = _.template('https://www.googleapis.com/language/translate/v2?key=<%= apiKey %>&q=<%= value %>&source=en&target=<%= languageKey %>');

    function transformResponse(res) {
        return _.get(JSON.parse(res.text), ['data', 'translations', 0, 'translatedText'], '');
    }

    function iterLeaves(value, keyChain, accumulator, languageKey) {
        accumulator = accumulator || {};
        keyChain = keyChain || [];
        if (_.isObject(value)) {
            return _.chain(value).reduce((handlers, v, k) => {
                return handlers.concat(iterLeaves(v, keyChain.concat(k), accumulator, languageKey));
            }, []).flattenDeep().value();
        } else {
            return function () {
                console.log(_.template('Translating <%= value %> to <%= languageKey %>')({value, languageKey}));

                //Translates individual string to language code
                return agent('GET', apiUrl({
                    value: encodeURI(value),
                    languageKey,
                    apiKey
                })).then(transformResponse).then((text) => {
                    //Sets the value in the accumulator
                    _.set(accumulator, keyChain, text);

                    //This needs to be returned to it's eventually written to json
                    return accumulator;
                });
            };
        }
    }

    Promise.all(_.reduce(destinationCodes, (sum, languageKey) => {
        const fileName = _.template('/tmp/<%= languageKey %>-<%= timeStamp %>.json')({
            languageKey,
            timeStamp: moment().unix()
        });

        //Starts with the top level strings
        return sum.concat(_.reduce(iterLeaves(JSON.parse(fs.readFileSync(path.resolve(inputFile), 'utf-8')), undefined, undefined, languageKey), (promiseChain, fn) => {
            return promiseChain.then(fn);
        }, Promise.resolve()).then((payload) => {
            fs.writeFileSync(fileName, JSON.stringify(payload));
        }).then(_.partial(console.log, 'Successfully translated all nodes, file output at ' + fileName)));
    }, [])).then(() => {
        process.exit();
    });

} else {
    console.error('You must provide an input json file and a comma-separated list of destination language codes.');
}