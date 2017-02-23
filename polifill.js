(function() {
    'use strict'
    const assert = require('assert');


    /*Object.entries*/
    const entries = require('object.entries');
    const obj = { a: 1, b: 2, c: 3 };
    const expected = [
        ['a', 1],
        ['b', 2],
        ['c', 3]
    ];
    if (typeof Symbol === 'function' && typeof Symbol() === 'symbol') {
        // for environments with Symbol support 
        const sym = Symbol();
        obj[sym] = 4;
        obj.d = sym;
        expected.push(['d', sym]);
    }
    assert.deepEqual(entries(obj), expected);
    if (!Object.entries) {
        entries.shim();
    }
    assert.deepEqual(Object.entries(obj), expected);


    /*set operations*/
    Set.prototype.isSuperset = Set.prototype.isSuperset || function(subset) {
        for (var elem of subset) {
            if (!this.has(elem)) {
                return false;
            }
        }
        return true;
    }

    Set.prototype.union = Set.prototype.union || function(setB) {
        return new Set([...this, ...setB]);
    }

    Set.prototype.union = Set.prototype.union || function(setB) {
        return new Set([...this, ...setB]);
    }

    Set.prototype.intersection = Set.prototype.intersection || function(setB) {
        return new Set([...this].filter(x => b.has(setB)));
    }

    Set.prototype.difference = Set.prototype.difference || function(setB) {
            return new Set([...this].filter(x => !setB.has(x)));
        }
        //end set operations
}())
