﻿var pSlice = Array.prototype.slice;
var objectKeys = Object.keys;//__webpack_require__(23);
var isArguments = function supported(object) {
    return Object.prototype.toString.call(object) == '[object Arguments]';
};//__webpack_require__(24);
var deepEqual = /*module.exports =*/ function (actual, expected, opts) {
    if (!opts)
        opts = {};
    // 7.1. All identical values are equivalent, as determined by ===.
    if (actual === expected) {
        return true;
    }
    else if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() === expected.getTime();
    }
    else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
        return opts.strict ? actual === expected : actual == expected;
    }
    else {
        return objEquiv(actual, expected, opts);
    }
};
function isUndefinedOrNull(value) {
    return value === null || value === undefined;
}
function isBuffer(x) {
    if (!x || typeof x !== 'object' || typeof x.length !== 'number')
        return false;
    if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
        return false;
    }
    if (x.length > 0 && typeof x[0] !== 'number')
        return false;
    return true;
}
function objEquiv(a, b, opts) {
    var i, key;
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
        return false;
    // an identical 'prototype' property.
    if (a.prototype !== b.prototype)
        return false;
    //~~~I've managed to break Object.keys through screwy arguments passing.
    //   Converting to array solves the problem.
    if (isArguments(a)) {
        if (!isArguments(b)) {
            return false;
        }
        a = pSlice.call(a);
        b = pSlice.call(b);
        return deepEqual(a, b, opts);
    }
    if (isBuffer(a)) {
        if (!isBuffer(b)) {
            return false;
        }
        if (a.length !== b.length)
            return false;
        for (i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
    try {
        var ka = objectKeys(a), kb = objectKeys(b);
    } catch (e) {
        return false;
    }
    // having the same number of owned properties (keys incorporates
    // hasOwnProperty)
    if (ka.length != kb.length)
        return false;
    //the same set of keys (although not necessarily the same order),
    ka.sort();
    kb.sort();
    for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] != kb[i])
            return false;
    }
    for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!deepEqual(a[key], b[key], opts))
            return false;
    }
    return typeof a === typeof b;
}