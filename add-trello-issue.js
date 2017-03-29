#!/usr/bin/env node

const _ = require('lodash');
const prompt = require('prompt');
const Trello = require('trello');
const colors = require('colors');
const promisify = require('es6-promisify');
const readOrPromptForKey = require('./lib/utils/file').readOrPromptForKey;

function headline(message) {
    console.log(colors.cyan(message));
}

function listOfChoices(list, key = 'name') {
    console.log(_.chain(list).map(_.property(key)).map((label, idx) => {
        return `${idx + 1}) ${label}`;
    }).value().join('\n'));
}

function rejectClosedBoards(boards) {
    return _.reject(boards, _.property('closed'));
}

function promptToSelectBoard(boards) {
    headline('Please select a Trello board');
    listOfChoices(boards);
    prompt.start();
    return promisify(prompt.get)([{
        name: 'choice',
        description: 'Enter the number for your selection'
    }]);
}

function promptToSelectList(lists, boardName) {
    headline(`Please select a Trello list from board ${boardName}`);
    listOfChoices(lists);
    prompt.start();
    return promisify(prompt.get)([{
        name: 'choice',
        description: 'Enter the number for your selection'
    }]);
}

function promptToAddCard() {
    headline('Use the prompts to add your Trello Card');
    prompt.start();
    return promisify(prompt.get)([{
        name: 'name',
        description: 'Card Name'
    }, {
        name: 'description',
        description: 'Card Description'
    }]);
}

readOrPromptForKey('keys.json', 'api.trello.apiKey', 'Trello API Key').then((trelloApiKey) => {
    return readOrPromptForKey('keys.json', 'api.trello.userKey', 'Trello User Key').then((trelloUserKey) => {
        const trelloApi = new Trello(trelloApiKey, trelloUserKey);
        return readOrPromptForKey('keys.json', 'api.trello.memberId', 'Trello Username').then((trelloMemberId) => {
            return trelloApi.getBoards(trelloMemberId).then(rejectClosedBoards).then((boards) => {
                return promptToSelectBoard(boards).then((result) => {
                    const board = boards[parseInt(result.choice) - 1];
                    if (board) {
                        return trelloApi.getListsOnBoard(board.id).then((lists) => {
                            return promptToSelectList(lists, board.name).then((result) => {
                                const list = lists[parseInt(result.choice) - 1];
                                if (list) {
                                    return promptToAddCard().then((result) => {
                                        return trelloApi.addCard(result.name, result.description, list.id).then(() => {
                                            console.log(colors.green(`Successfully added ${result.name} to Trello.`));
                                        }).catch(() => {
                                            console.log(colors.red(`Error adding ${result.name} to Trello.`));
                                        });
                                    });
                                } else {
                                    console.error(colors.red('You must select a valid Trello list!'));
                                }
                            });
                        })
                    } else {
                        console.error(colors.red('You must select a valid Trello board!'));
                    }
                })
            });
        });
    });
}).then(process.exit);

