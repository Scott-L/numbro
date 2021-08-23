(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.numbro = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
;(function (globalObject) {
  'use strict';

/*
 *      bignumber.js v8.1.1
 *      A JavaScript library for arbitrary-precision arithmetic.
 *      https://github.com/MikeMcl/bignumber.js
 *      Copyright (c) 2019 Michael Mclaughlin <M8ch88l@gmail.com>
 *      MIT Licensed.
 *
 *      BigNumber.prototype methods     |  BigNumber methods
 *                                      |
 *      absoluteValue            abs    |  clone
 *      comparedTo                      |  config               set
 *      decimalPlaces            dp     |      DECIMAL_PLACES
 *      dividedBy                div    |      ROUNDING_MODE
 *      dividedToIntegerBy       idiv   |      EXPONENTIAL_AT
 *      exponentiatedBy          pow    |      RANGE
 *      integerValue                    |      CRYPTO
 *      isEqualTo                eq     |      MODULO_MODE
 *      isFinite                        |      POW_PRECISION
 *      isGreaterThan            gt     |      FORMAT
 *      isGreaterThanOrEqualTo   gte    |      ALPHABET
 *      isInteger                       |  isBigNumber
 *      isLessThan               lt     |  maximum              max
 *      isLessThanOrEqualTo      lte    |  minimum              min
 *      isNaN                           |  random
 *      isNegative                      |  sum
 *      isPositive                      |
 *      isZero                          |
 *      minus                           |
 *      modulo                   mod    |
 *      multipliedBy             times  |
 *      negated                         |
 *      plus                            |
 *      precision                sd     |
 *      shiftedBy                       |
 *      squareRoot               sqrt   |
 *      toExponential                   |
 *      toFixed                         |
 *      toFormat                        |
 *      toFraction                      |
 *      toJSON                          |
 *      toNumber                        |
 *      toPrecision                     |
 *      toString                        |
 *      valueOf                         |
 *
 */


  var BigNumber,
    isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i,
    hasSymbol = typeof Symbol == 'function' && typeof Symbol.iterator == 'symbol',

    mathceil = Math.ceil,
    mathfloor = Math.floor,

    bignumberError = '[BigNumber Error] ',
    tooManyDigits = bignumberError + 'Number primitive has more than 15 significant digits: ',

    BASE = 1e14,
    LOG_BASE = 14,
    MAX_SAFE_INTEGER = 0x1fffffffffffff,         // 2^53 - 1
    // MAX_INT32 = 0x7fffffff,                   // 2^31 - 1
    POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13],
    SQRT_BASE = 1e7,

    // EDITABLE
    // The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP, MAX_EXP, and
    // the arguments to toExponential, toFixed, toFormat, and toPrecision.
    MAX = 1E9;                                   // 0 to MAX_INT32


  /*
   * Create and return a BigNumber constructor.
   */
  function clone(configObject) {
    var div, convertBase, parseNumeric,
      P = BigNumber.prototype = { constructor: BigNumber, toString: null, valueOf: null },
      ONE = new BigNumber(1),


      //----------------------------- EDITABLE CONFIG DEFAULTS -------------------------------


      // The default values below must be integers within the inclusive ranges stated.
      // The values can also be changed at run-time using BigNumber.set.

      // The maximum number of decimal places for operations involving division.
      DECIMAL_PLACES = 20,                     // 0 to MAX

      // The rounding mode used when rounding to the above decimal places, and when using
      // toExponential, toFixed, toFormat and toPrecision, and round (default value).
      // UP         0 Away from zero.
      // DOWN       1 Towards zero.
      // CEIL       2 Towards +Infinity.
      // FLOOR      3 Towards -Infinity.
      // HALF_UP    4 Towards nearest neighbour. If equidistant, up.
      // HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
      // HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
      // HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
      // HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
      ROUNDING_MODE = 4,                       // 0 to 8

      // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

      // The exponent value at and beneath which toString returns exponential notation.
      // Number type: -7
      TO_EXP_NEG = -7,                         // 0 to -MAX

      // The exponent value at and above which toString returns exponential notation.
      // Number type: 21
      TO_EXP_POS = 21,                         // 0 to MAX

      // RANGE : [MIN_EXP, MAX_EXP]

      // The minimum exponent value, beneath which underflow to zero occurs.
      // Number type: -324  (5e-324)
      MIN_EXP = -1e7,                          // -1 to -MAX

      // The maximum exponent value, above which overflow to Infinity occurs.
      // Number type:  308  (1.7976931348623157e+308)
      // For MAX_EXP > 1e7, e.g. new BigNumber('1e100000000').plus(1) may be slow.
      MAX_EXP = 1e7,                           // 1 to MAX

      // Whether to use cryptographically-secure random number generation, if available.
      CRYPTO = false,                          // true or false

      // The modulo mode used when calculating the modulus: a mod n.
      // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
      // The remainder (r) is calculated as: r = a - n * q.
      //
      // UP        0 The remainder is positive if the dividend is negative, else is negative.
      // DOWN      1 The remainder has the same sign as the dividend.
      //             This modulo mode is commonly known as 'truncated division' and is
      //             equivalent to (a % n) in JavaScript.
      // FLOOR     3 The remainder has the same sign as the divisor (Python %).
      // HALF_EVEN 6 This modulo mode implements the IEEE 754 remainder function.
      // EUCLID    9 Euclidian division. q = sign(n) * floor(a / abs(n)).
      //             The remainder is always positive.
      //
      // The truncated division, floored division, Euclidian division and IEEE 754 remainder
      // modes are commonly used for the modulus operation.
      // Although the other rounding modes can also be used, they may not give useful results.
      MODULO_MODE = 1,                         // 0 to 9

      // The maximum number of significant digits of the result of the exponentiatedBy operation.
      // If POW_PRECISION is 0, there will be unlimited significant digits.
      POW_PRECISION = 0,                    // 0 to MAX

      // The format specification used by the BigNumber.prototype.toFormat method.
      FORMAT = {
        prefix: '',
        groupSize: 3,
        secondaryGroupSize: 0,
        groupSeparator: ',',
        decimalSeparator: '.',
        fractionGroupSize: 0,
        fractionGroupSeparator: '\xA0',      // non-breaking space
        suffix: ''
      },

      // The alphabet used for base conversion. It must be at least 2 characters long, with no '+',
      // '-', '.', whitespace, or repeated character.
      // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_'
      ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';


    //------------------------------------------------------------------------------------------


    // CONSTRUCTOR


    /*
     * The BigNumber constructor and exported function.
     * Create and return a new instance of a BigNumber object.
     *
     * v {number|string|BigNumber} A numeric value.
     * [b] {number} The base of v. Integer, 2 to ALPHABET.length inclusive.
     */
    function BigNumber(v, b) {
      var alphabet, c, caseChanged, e, i, isNum, len, str,
        x = this;

      // Enable constructor call without `new`.
      if (!(x instanceof BigNumber)) return new BigNumber(v, b);

      if (b == null) {

        if (v && v._isBigNumber === true) {
          x.s = v.s;

          if (!v.c || v.e > MAX_EXP) {
            x.c = x.e = null;
          } else if (v.e < MIN_EXP) {
            x.c = [x.e = 0];
          } else {
            x.e = v.e;
            x.c = v.c.slice();
          }

          return;
        }

        if ((isNum = typeof v == 'number') && v * 0 == 0) {

          // Use `1 / n` to handle minus zero also.
          x.s = 1 / v < 0 ? (v = -v, -1) : 1;

          // Fast path for integers, where n < 2147483648 (2**31).
          if (v === ~~v) {
            for (e = 0, i = v; i >= 10; i /= 10, e++);

            if (e > MAX_EXP) {
              x.c = x.e = null;
            } else {
              x.e = e;
              x.c = [v];
            }

            return;
          }

          str = String(v);
        } else {

          if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);

          x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
        }

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

        // Exponential form?
        if ((i = str.search(/e/i)) > 0) {

          // Determine exponent.
          if (e < 0) e = i;
          e += +str.slice(i + 1);
          str = str.substring(0, i);
        } else if (e < 0) {

          // Integer.
          e = str.length;
        }

      } else {

        // '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
        intCheck(b, 2, ALPHABET.length, 'Base');

        // Allow exponential notation to be used with base 10 argument, while
        // also rounding to DECIMAL_PLACES as with other bases.
        if (b == 10) {
          x = new BigNumber(v);
          return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
        }

        str = String(v);

        if (isNum = typeof v == 'number') {

          // Avoid potential interpretation of Infinity and NaN as base 44+ values.
          if (v * 0 != 0) return parseNumeric(x, str, isNum, b);

          x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;

          // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
          if (BigNumber.DEBUG && str.replace(/^0\.0*|\./, '').length > 15) {
            throw Error
             (tooManyDigits + v);
          }
        } else {
          x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
        }

        alphabet = ALPHABET.slice(0, b);
        e = i = 0;

        // Check that str is a valid base b number.
        // Don't use RegExp, so alphabet can contain special characters.
        for (len = str.length; i < len; i++) {
          if (alphabet.indexOf(c = str.charAt(i)) < 0) {
            if (c == '.') {

              // If '.' is not the first character and it has not be found before.
              if (i > e) {
                e = len;
                continue;
              }
            } else if (!caseChanged) {

              // Allow e.g. hexadecimal 'FF' as well as 'ff'.
              if (str == str.toUpperCase() && (str = str.toLowerCase()) ||
                  str == str.toLowerCase() && (str = str.toUpperCase())) {
                caseChanged = true;
                i = -1;
                e = 0;
                continue;
              }
            }

            return parseNumeric(x, String(v), isNum, b);
          }
        }

        // Prevent later check for length on converted number.
        isNum = false;
        str = convertBase(str, b, 10, x.s);

        // Decimal point?
        if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');
        else e = str.length;
      }

      // Determine leading zeros.
      for (i = 0; str.charCodeAt(i) === 48; i++);

      // Determine trailing zeros.
      for (len = str.length; str.charCodeAt(--len) === 48;);

      if (str = str.slice(i, ++len)) {
        len -= i;

        // '[BigNumber Error] Number primitive has more than 15 significant digits: {n}'
        if (isNum && BigNumber.DEBUG &&
          len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
            throw Error
             (tooManyDigits + (x.s * v));
        }

         // Overflow?
        if ((e = e - i - 1) > MAX_EXP) {

          // Infinity.
          x.c = x.e = null;

        // Underflow?
        } else if (e < MIN_EXP) {

          // Zero.
          x.c = [x.e = 0];
        } else {
          x.e = e;
          x.c = [];

          // Transform base

          // e is the base 10 exponent.
          // i is where to slice str to get the first element of the coefficient array.
          i = (e + 1) % LOG_BASE;
          if (e < 0) i += LOG_BASE;  // i < 1

          if (i < len) {
            if (i) x.c.push(+str.slice(0, i));

            for (len -= LOG_BASE; i < len;) {
              x.c.push(+str.slice(i, i += LOG_BASE));
            }

            i = LOG_BASE - (str = str.slice(i)).length;
          } else {
            i -= len;
          }

          for (; i--; str += '0');
          x.c.push(+str);
        }
      } else {

        // Zero.
        x.c = [x.e = 0];
      }
    }


    // CONSTRUCTOR PROPERTIES


    BigNumber.clone = clone;

    BigNumber.ROUND_UP = 0;
    BigNumber.ROUND_DOWN = 1;
    BigNumber.ROUND_CEIL = 2;
    BigNumber.ROUND_FLOOR = 3;
    BigNumber.ROUND_HALF_UP = 4;
    BigNumber.ROUND_HALF_DOWN = 5;
    BigNumber.ROUND_HALF_EVEN = 6;
    BigNumber.ROUND_HALF_CEIL = 7;
    BigNumber.ROUND_HALF_FLOOR = 8;
    BigNumber.EUCLID = 9;


    /*
     * Configure infrequently-changing library-wide settings.
     *
     * Accept an object with the following optional properties (if the value of a property is
     * a number, it must be an integer within the inclusive range stated):
     *
     *   DECIMAL_PLACES   {number}           0 to MAX
     *   ROUNDING_MODE    {number}           0 to 8
     *   EXPONENTIAL_AT   {number|number[]}  -MAX to MAX  or  [-MAX to 0, 0 to MAX]
     *   RANGE            {number|number[]}  -MAX to MAX (not zero)  or  [-MAX to -1, 1 to MAX]
     *   CRYPTO           {boolean}          true or false
     *   MODULO_MODE      {number}           0 to 9
     *   POW_PRECISION       {number}           0 to MAX
     *   ALPHABET         {string}           A string of two or more unique characters which does
     *                                       not contain '.'.
     *   FORMAT           {object}           An object with some of the following properties:
     *     prefix                 {string}
     *     groupSize              {number}
     *     secondaryGroupSize     {number}
     *     groupSeparator         {string}
     *     decimalSeparator       {string}
     *     fractionGroupSize      {number}
     *     fractionGroupSeparator {string}
     *     suffix                 {string}
     *
     * (The values assigned to the above FORMAT object properties are not checked for validity.)
     *
     * E.g.
     * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
     *
     * Ignore properties/parameters set to null or undefined, except for ALPHABET.
     *
     * Return an object with the properties current values.
     */
    BigNumber.config = BigNumber.set = function (obj) {
      var p, v;

      if (obj != null) {

        if (typeof obj == 'object') {

          // DECIMAL_PLACES {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] DECIMAL_PLACES {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'DECIMAL_PLACES')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            DECIMAL_PLACES = v;
          }

          // ROUNDING_MODE {number} Integer, 0 to 8 inclusive.
          // '[BigNumber Error] ROUNDING_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'ROUNDING_MODE')) {
            v = obj[p];
            intCheck(v, 0, 8, p);
            ROUNDING_MODE = v;
          }

          // EXPONENTIAL_AT {number|number[]}
          // Integer, -MAX to MAX inclusive or
          // [integer -MAX to 0 inclusive, 0 to MAX inclusive].
          // '[BigNumber Error] EXPONENTIAL_AT {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'EXPONENTIAL_AT')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, 0, p);
              intCheck(v[1], 0, MAX, p);
              TO_EXP_NEG = v[0];
              TO_EXP_POS = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
            }
          }

          // RANGE {number|number[]} Non-zero integer, -MAX to MAX inclusive or
          // [integer -MAX to -1 inclusive, integer 1 to MAX inclusive].
          // '[BigNumber Error] RANGE {not a primitive number|not an integer|out of range|cannot be zero}: {v}'
          if (obj.hasOwnProperty(p = 'RANGE')) {
            v = obj[p];
            if (v && v.pop) {
              intCheck(v[0], -MAX, -1, p);
              intCheck(v[1], 1, MAX, p);
              MIN_EXP = v[0];
              MAX_EXP = v[1];
            } else {
              intCheck(v, -MAX, MAX, p);
              if (v) {
                MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
              } else {
                throw Error
                 (bignumberError + p + ' cannot be zero: ' + v);
              }
            }
          }

          // CRYPTO {boolean} true or false.
          // '[BigNumber Error] CRYPTO not true or false: {v}'
          // '[BigNumber Error] crypto unavailable'
          if (obj.hasOwnProperty(p = 'CRYPTO')) {
            v = obj[p];
            if (v === !!v) {
              if (v) {
                if (typeof crypto != 'undefined' && crypto &&
                 (crypto.getRandomValues || crypto.randomBytes)) {
                  CRYPTO = v;
                } else {
                  CRYPTO = !v;
                  throw Error
                   (bignumberError + 'crypto unavailable');
                }
              } else {
                CRYPTO = v;
              }
            } else {
              throw Error
               (bignumberError + p + ' not true or false: ' + v);
            }
          }

          // MODULO_MODE {number} Integer, 0 to 9 inclusive.
          // '[BigNumber Error] MODULO_MODE {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'MODULO_MODE')) {
            v = obj[p];
            intCheck(v, 0, 9, p);
            MODULO_MODE = v;
          }

          // POW_PRECISION {number} Integer, 0 to MAX inclusive.
          // '[BigNumber Error] POW_PRECISION {not a primitive number|not an integer|out of range}: {v}'
          if (obj.hasOwnProperty(p = 'POW_PRECISION')) {
            v = obj[p];
            intCheck(v, 0, MAX, p);
            POW_PRECISION = v;
          }

          // FORMAT {object}
          // '[BigNumber Error] FORMAT not an object: {v}'
          if (obj.hasOwnProperty(p = 'FORMAT')) {
            v = obj[p];
            if (typeof v == 'object') FORMAT = v;
            else throw Error
             (bignumberError + p + ' not an object: ' + v);
          }

          // ALPHABET {string}
          // '[BigNumber Error] ALPHABET invalid: {v}'
          if (obj.hasOwnProperty(p = 'ALPHABET')) {
            v = obj[p];

            // Disallow if only one character,
            // or if it contains '+', '-', '.', whitespace, or a repeated character.
            if (typeof v == 'string' && !/^.$|[+-.\s]|(.).*\1/.test(v)) {
              ALPHABET = v;
            } else {
              throw Error
               (bignumberError + p + ' invalid: ' + v);
            }
          }

        } else {

          // '[BigNumber Error] Object expected: {v}'
          throw Error
           (bignumberError + 'Object expected: ' + obj);
        }
      }

      return {
        DECIMAL_PLACES: DECIMAL_PLACES,
        ROUNDING_MODE: ROUNDING_MODE,
        EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
        RANGE: [MIN_EXP, MAX_EXP],
        CRYPTO: CRYPTO,
        MODULO_MODE: MODULO_MODE,
        POW_PRECISION: POW_PRECISION,
        FORMAT: FORMAT,
        ALPHABET: ALPHABET
      };
    };


    /*
     * Return true if v is a BigNumber instance, otherwise return false.
     *
     * If BigNumber.DEBUG is true, throw if a BigNumber instance is not well-formed.
     *
     * v {any}
     *
     * '[BigNumber Error] Invalid BigNumber: {v}'
     */
    BigNumber.isBigNumber = function (v) {
      if (!v || v._isBigNumber !== true) return false;
      if (!BigNumber.DEBUG) return true;

      var i, n,
        c = v.c,
        e = v.e,
        s = v.s;

      out: if ({}.toString.call(c) == '[object Array]') {

        if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {

          // If the first element is zero, the BigNumber value must be zero.
          if (c[0] === 0) {
            if (e === 0 && c.length === 1) return true;
            break out;
          }

          // Calculate number of digits that c[0] should have, based on the exponent.
          i = (e + 1) % LOG_BASE;
          if (i < 1) i += LOG_BASE;

          // Calculate number of digits of c[0].
          //if (Math.ceil(Math.log(c[0] + 1) / Math.LN10) == i) {
          if (String(c[0]).length == i) {

            for (i = 0; i < c.length; i++) {
              n = c[i];
              if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
            }

            // Last element cannot be zero, unless it is the only element.
            if (n !== 0) return true;
          }
        }

      // Infinity/NaN
      } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
        return true;
      }

      throw Error
        (bignumberError + 'Invalid BigNumber: ' + v);
    };


    /*
     * Return a new BigNumber whose value is the maximum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.maximum = BigNumber.max = function () {
      return maxOrMin(arguments, P.lt);
    };


    /*
     * Return a new BigNumber whose value is the minimum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.minimum = BigNumber.min = function () {
      return maxOrMin(arguments, P.gt);
    };


    /*
     * Return a new BigNumber with a random value equal to or greater than 0 and less than 1,
     * and with dp, or DECIMAL_PLACES if dp is omitted, decimal places (or less if trailing
     * zeros are produced).
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp}'
     * '[BigNumber Error] crypto unavailable'
     */
    BigNumber.random = (function () {
      var pow2_53 = 0x20000000000000;

      // Return a 53 bit integer n, where 0 <= n < 9007199254740992.
      // Check if Math.random() produces more than 32 bits of randomness.
      // If it does, assume at least 53 bits are produced, otherwise assume at least 30 bits.
      // 0x40000000 is 2^30, 0x800000 is 2^23, 0x1fffff is 2^21 - 1.
      var random53bitInt = (Math.random() * pow2_53) & 0x1fffff
       ? function () { return mathfloor(Math.random() * pow2_53); }
       : function () { return ((Math.random() * 0x40000000 | 0) * 0x800000) +
         (Math.random() * 0x800000 | 0); };

      return function (dp) {
        var a, b, e, k, v,
          i = 0,
          c = [],
          rand = new BigNumber(ONE);

        if (dp == null) dp = DECIMAL_PLACES;
        else intCheck(dp, 0, MAX);

        k = mathceil(dp / LOG_BASE);

        if (CRYPTO) {

          // Browsers supporting crypto.getRandomValues.
          if (crypto.getRandomValues) {

            a = crypto.getRandomValues(new Uint32Array(k *= 2));

            for (; i < k;) {

              // 53 bits:
              // ((Math.pow(2, 32) - 1) * Math.pow(2, 21)).toString(2)
              // 11111 11111111 11111111 11111111 11100000 00000000 00000000
              // ((Math.pow(2, 32) - 1) >>> 11).toString(2)
              //                                     11111 11111111 11111111
              // 0x20000 is 2^21.
              v = a[i] * 0x20000 + (a[i + 1] >>> 11);

              // Rejection sampling:
              // 0 <= v < 9007199254740992
              // Probability that v >= 9e15, is
              // 7199254740992 / 9007199254740992 ~= 0.0008, i.e. 1 in 1251
              if (v >= 9e15) {
                b = crypto.getRandomValues(new Uint32Array(2));
                a[i] = b[0];
                a[i + 1] = b[1];
              } else {

                // 0 <= v <= 8999999999999999
                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 2;
              }
            }
            i = k / 2;

          // Node.js supporting crypto.randomBytes.
          } else if (crypto.randomBytes) {

            // buffer
            a = crypto.randomBytes(k *= 7);

            for (; i < k;) {

              // 0x1000000000000 is 2^48, 0x10000000000 is 2^40
              // 0x100000000 is 2^32, 0x1000000 is 2^24
              // 11111 11111111 11111111 11111111 11111111 11111111 11111111
              // 0 <= v < 9007199254740992
              v = ((a[i] & 31) * 0x1000000000000) + (a[i + 1] * 0x10000000000) +
                 (a[i + 2] * 0x100000000) + (a[i + 3] * 0x1000000) +
                 (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];

              if (v >= 9e15) {
                crypto.randomBytes(7).copy(a, i);
              } else {

                // 0 <= (v % 1e14) <= 99999999999999
                c.push(v % 1e14);
                i += 7;
              }
            }
            i = k / 7;
          } else {
            CRYPTO = false;
            throw Error
             (bignumberError + 'crypto unavailable');
          }
        }

        // Use Math.random.
        if (!CRYPTO) {

          for (; i < k;) {
            v = random53bitInt();
            if (v < 9e15) c[i++] = v % 1e14;
          }
        }

        k = c[--i];
        dp %= LOG_BASE;

        // Convert trailing digits to zeros according to dp.
        if (k && dp) {
          v = POWS_TEN[LOG_BASE - dp];
          c[i] = mathfloor(k / v) * v;
        }

        // Remove trailing elements which are zero.
        for (; c[i] === 0; c.pop(), i--);

        // Zero?
        if (i < 0) {
          c = [e = 0];
        } else {

          // Remove leading elements which are zero and adjust exponent accordingly.
          for (e = -1 ; c[0] === 0; c.splice(0, 1), e -= LOG_BASE);

          // Count the digits of the first element of c to determine leading zeros, and...
          for (i = 1, v = c[0]; v >= 10; v /= 10, i++);

          // adjust the exponent accordingly.
          if (i < LOG_BASE) e -= LOG_BASE - i;
        }

        rand.e = e;
        rand.c = c;
        return rand;
      };
    })();


    /*
     * Return a BigNumber whose value is the sum of the arguments.
     *
     * arguments {number|string|BigNumber}
     */
    BigNumber.sum = function () {
      var i = 1,
        args = arguments,
        sum = new BigNumber(args[0]);
      for (; i < args.length;) sum = sum.plus(args[i++]);
      return sum;
    };


    // PRIVATE FUNCTIONS


    // Called by BigNumber and BigNumber.prototype.toString.
    convertBase = (function () {
      var decimal = '0123456789';

      /*
       * Convert string of baseIn to an array of numbers of baseOut.
       * Eg. toBaseOut('255', 10, 16) returns [15, 15].
       * Eg. toBaseOut('ff', 16, 10) returns [2, 5, 5].
       */
      function toBaseOut(str, baseIn, baseOut, alphabet) {
        var j,
          arr = [0],
          arrL,
          i = 0,
          len = str.length;

        for (; i < len;) {
          for (arrL = arr.length; arrL--; arr[arrL] *= baseIn);

          arr[0] += alphabet.indexOf(str.charAt(i++));

          for (j = 0; j < arr.length; j++) {

            if (arr[j] > baseOut - 1) {
              if (arr[j + 1] == null) arr[j + 1] = 0;
              arr[j + 1] += arr[j] / baseOut | 0;
              arr[j] %= baseOut;
            }
          }
        }

        return arr.reverse();
      }

      // Convert a numeric string of baseIn to a numeric string of baseOut.
      // If the caller is toString, we are converting from base 10 to baseOut.
      // If the caller is BigNumber, we are converting from baseIn to base 10.
      return function (str, baseIn, baseOut, sign, callerIsToString) {
        var alphabet, d, e, k, r, x, xc, y,
          i = str.indexOf('.'),
          dp = DECIMAL_PLACES,
          rm = ROUNDING_MODE;

        // Non-integer.
        if (i >= 0) {
          k = POW_PRECISION;

          // Unlimited precision.
          POW_PRECISION = 0;
          str = str.replace('.', '');
          y = new BigNumber(baseIn);
          x = y.pow(str.length - i);
          POW_PRECISION = k;

          // Convert str as if an integer, then restore the fraction part by dividing the
          // result by its base raised to a power.

          y.c = toBaseOut(toFixedPoint(coeffToString(x.c), x.e, '0'),
           10, baseOut, decimal);
          y.e = y.c.length;
        }

        // Convert the number as integer.

        xc = toBaseOut(str, baseIn, baseOut, callerIsToString
         ? (alphabet = ALPHABET, decimal)
         : (alphabet = decimal, ALPHABET));

        // xc now represents str as an integer and converted to baseOut. e is the exponent.
        e = k = xc.length;

        // Remove trailing zeros.
        for (; xc[--k] == 0; xc.pop());

        // Zero?
        if (!xc[0]) return alphabet.charAt(0);

        // Does str represent an integer? If so, no need for the division.
        if (i < 0) {
          --e;
        } else {
          x.c = xc;
          x.e = e;

          // The sign is needed for correct rounding.
          x.s = sign;
          x = div(x, y, dp, rm, baseOut);
          xc = x.c;
          r = x.r;
          e = x.e;
        }

        // xc now represents str converted to baseOut.

        // THe index of the rounding digit.
        d = e + dp + 1;

        // The rounding digit: the digit to the right of the digit that may be rounded up.
        i = xc[d];

        // Look at the rounding digits and mode to determine whether to round up.

        k = baseOut / 2;
        r = r || d < 0 || xc[d + 1] != null;

        r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
              : i > k || i == k &&(rm == 4 || r || rm == 6 && xc[d - 1] & 1 ||
               rm == (x.s < 0 ? 8 : 7));

        // If the index of the rounding digit is not greater than zero, or xc represents
        // zero, then the result of the base conversion is zero or, if rounding up, a value
        // such as 0.00001.
        if (d < 1 || !xc[0]) {

          // 1^-dp or 0
          str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
        } else {

          // Truncate xc to the required number of decimal places.
          xc.length = d;

          // Round up?
          if (r) {

            // Rounding up may mean the previous digit has to be rounded up and so on.
            for (--baseOut; ++xc[--d] > baseOut;) {
              xc[d] = 0;

              if (!d) {
                ++e;
                xc = [1].concat(xc);
              }
            }
          }

          // Determine trailing zeros.
          for (k = xc.length; !xc[--k];);

          // E.g. [4, 11, 15] becomes 4bf.
          for (i = 0, str = ''; i <= k; str += alphabet.charAt(xc[i++]));

          // Add leading zeros, decimal point and trailing zeros as required.
          str = toFixedPoint(str, e, alphabet.charAt(0));
        }

        // The caller will add the sign.
        return str;
      };
    })();


    // Perform division in the specified base. Called by div and convertBase.
    div = (function () {

      // Assume non-zero x and k.
      function multiply(x, k, base) {
        var m, temp, xlo, xhi,
          carry = 0,
          i = x.length,
          klo = k % SQRT_BASE,
          khi = k / SQRT_BASE | 0;

        for (x = x.slice(); i--;) {
          xlo = x[i] % SQRT_BASE;
          xhi = x[i] / SQRT_BASE | 0;
          m = khi * xlo + xhi * klo;
          temp = klo * xlo + ((m % SQRT_BASE) * SQRT_BASE) + carry;
          carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
          x[i] = temp % base;
        }

        if (carry) x = [carry].concat(x);

        return x;
      }

      function compare(a, b, aL, bL) {
        var i, cmp;

        if (aL != bL) {
          cmp = aL > bL ? 1 : -1;
        } else {

          for (i = cmp = 0; i < aL; i++) {

            if (a[i] != b[i]) {
              cmp = a[i] > b[i] ? 1 : -1;
              break;
            }
          }
        }

        return cmp;
      }

      function subtract(a, b, aL, base) {
        var i = 0;

        // Subtract b from a.
        for (; aL--;) {
          a[aL] -= i;
          i = a[aL] < b[aL] ? 1 : 0;
          a[aL] = i * base + a[aL] - b[aL];
        }

        // Remove leading zeros.
        for (; !a[0] && a.length > 1; a.splice(0, 1));
      }

      // x: dividend, y: divisor.
      return function (x, y, dp, rm, base) {
        var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0,
          yL, yz,
          s = x.s == y.s ? 1 : -1,
          xc = x.c,
          yc = y.c;

        // Either NaN, Infinity or 0?
        if (!xc || !xc[0] || !yc || !yc[0]) {

          return new BigNumber(

           // Return NaN if either NaN, or both Infinity or 0.
           !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN :

            // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
            xc && xc[0] == 0 || !yc ? s * 0 : s / 0
         );
        }

        q = new BigNumber(s);
        qc = q.c = [];
        e = x.e - y.e;
        s = dp + e + 1;

        if (!base) {
          base = BASE;
          e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
          s = s / LOG_BASE | 0;
        }

        // Result exponent may be one less then the current value of e.
        // The coefficients of the BigNumbers from convertBase may have trailing zeros.
        for (i = 0; yc[i] == (xc[i] || 0); i++);

        if (yc[i] > (xc[i] || 0)) e--;

        if (s < 0) {
          qc.push(1);
          more = true;
        } else {
          xL = xc.length;
          yL = yc.length;
          i = 0;
          s += 2;

          // Normalise xc and yc so highest order digit of yc is >= base / 2.

          n = mathfloor(base / (yc[0] + 1));

          // Not necessary, but to handle odd bases where yc[0] == (base / 2) - 1.
          // if (n > 1 || n++ == 1 && yc[0] < base / 2) {
          if (n > 1) {
            yc = multiply(yc, n, base);
            xc = multiply(xc, n, base);
            yL = yc.length;
            xL = xc.length;
          }

          xi = yL;
          rem = xc.slice(0, yL);
          remL = rem.length;

          // Add zeros to make remainder as long as divisor.
          for (; remL < yL; rem[remL++] = 0);
          yz = yc.slice();
          yz = [0].concat(yz);
          yc0 = yc[0];
          if (yc[1] >= base / 2) yc0++;
          // Not necessary, but to prevent trial digit n > base, when using base 3.
          // else if (base == 3 && yc0 == 1) yc0 = 1 + 1e-15;

          do {
            n = 0;

            // Compare divisor and remainder.
            cmp = compare(yc, rem, yL, remL);

            // If divisor < remainder.
            if (cmp < 0) {

              // Calculate trial digit, n.

              rem0 = rem[0];
              if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

              // n is how many times the divisor goes into the current remainder.
              n = mathfloor(rem0 / yc0);

              //  Algorithm:
              //  product = divisor multiplied by trial digit (n).
              //  Compare product and remainder.
              //  If product is greater than remainder:
              //    Subtract divisor from product, decrement trial digit.
              //  Subtract product from remainder.
              //  If product was less than remainder at the last compare:
              //    Compare new remainder and divisor.
              //    If remainder is greater than divisor:
              //      Subtract divisor from remainder, increment trial digit.

              if (n > 1) {

                // n may be > base only when base is 3.
                if (n >= base) n = base - 1;

                // product = divisor * trial digit.
                prod = multiply(yc, n, base);
                prodL = prod.length;
                remL = rem.length;

                // Compare product and remainder.
                // If product > remainder then trial digit n too high.
                // n is 1 too high about 5% of the time, and is not known to have
                // ever been more than 1 too high.
                while (compare(prod, rem, prodL, remL) == 1) {
                  n--;

                  // Subtract divisor from product.
                  subtract(prod, yL < prodL ? yz : yc, prodL, base);
                  prodL = prod.length;
                  cmp = 1;
                }
              } else {

                // n is 0 or 1, cmp is -1.
                // If n is 0, there is no need to compare yc and rem again below,
                // so change cmp to 1 to avoid it.
                // If n is 1, leave cmp as -1, so yc and rem are compared again.
                if (n == 0) {

                  // divisor < remainder, so n must be at least 1.
                  cmp = n = 1;
                }

                // product = divisor
                prod = yc.slice();
                prodL = prod.length;
              }

              if (prodL < remL) prod = [0].concat(prod);

              // Subtract product from remainder.
              subtract(rem, prod, remL, base);
              remL = rem.length;

               // If product was < remainder.
              if (cmp == -1) {

                // Compare divisor and new remainder.
                // If divisor < new remainder, subtract divisor from remainder.
                // Trial digit n too low.
                // n is 1 too low about 5% of the time, and very rarely 2 too low.
                while (compare(yc, rem, yL, remL) < 1) {
                  n++;

                  // Subtract divisor from remainder.
                  subtract(rem, yL < remL ? yz : yc, remL, base);
                  remL = rem.length;
                }
              }
            } else if (cmp === 0) {
              n++;
              rem = [0];
            } // else cmp === 1 and n will be 0

            // Add the next digit, n, to the result array.
            qc[i++] = n;

            // Update the remainder.
            if (rem[0]) {
              rem[remL++] = xc[xi] || 0;
            } else {
              rem = [xc[xi]];
              remL = 1;
            }
          } while ((xi++ < xL || rem[0] != null) && s--);

          more = rem[0] != null;

          // Leading zero?
          if (!qc[0]) qc.splice(0, 1);
        }

        if (base == BASE) {

          // To calculate q.e, first get the number of digits of qc[0].
          for (i = 1, s = qc[0]; s >= 10; s /= 10, i++);

          round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);

        // Caller is convertBase.
        } else {
          q.e = e;
          q.r = +more;
        }

        return q;
      };
    })();


    /*
     * Return a string representing the value of BigNumber n in fixed-point or exponential
     * notation rounded to the specified decimal places or significant digits.
     *
     * n: a BigNumber.
     * i: the index of the last digit required (i.e. the digit that may be rounded up).
     * rm: the rounding mode.
     * id: 1 (toExponential) or 2 (toPrecision).
     */
    function format(n, i, rm, id) {
      var c0, e, ne, len, str;

      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);

      if (!n.c) return n.toString();

      c0 = n.c[0];
      ne = n.e;

      if (i == null) {
        str = coeffToString(n.c);
        str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS)
         ? toExponential(str, ne)
         : toFixedPoint(str, ne, '0');
      } else {
        n = round(new BigNumber(n), i, rm);

        // n.e may have changed if the value was rounded up.
        e = n.e;

        str = coeffToString(n.c);
        len = str.length;

        // toPrecision returns exponential notation if the number of significant digits
        // specified is less than the number of digits necessary to represent the integer
        // part of the value in fixed-point notation.

        // Exponential notation.
        if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {

          // Append zeros?
          for (; len < i; str += '0', len++);
          str = toExponential(str, e);

        // Fixed-point notation.
        } else {
          i -= ne;
          str = toFixedPoint(str, e, '0');

          // Append zeros?
          if (e + 1 > len) {
            if (--i > 0) for (str += '.'; i--; str += '0');
          } else {
            i += e - len;
            if (i > 0) {
              if (e + 1 == len) str += '.';
              for (; i--; str += '0');
            }
          }
        }
      }

      return n.s < 0 && c0 ? '-' + str : str;
    }


    // Handle BigNumber.max and BigNumber.min.
    function maxOrMin(args, method) {
      var n,
        i = 1,
        m = new BigNumber(args[0]);

      for (; i < args.length; i++) {
        n = new BigNumber(args[i]);

        // If any number is NaN, return NaN.
        if (!n.s) {
          m = n;
          break;
        } else if (method.call(m, n)) {
          m = n;
        }
      }

      return m;
    }


    /*
     * Strip trailing zeros, calculate base 10 exponent and check against MIN_EXP and MAX_EXP.
     * Called by minus, plus and times.
     */
    function normalise(n, c, e) {
      var i = 1,
        j = c.length;

       // Remove trailing zeros.
      for (; !c[--j]; c.pop());

      // Calculate the base 10 exponent. First get the number of digits of c[0].
      for (j = c[0]; j >= 10; j /= 10, i++);

      // Overflow?
      if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {

        // Infinity.
        n.c = n.e = null;

      // Underflow?
      } else if (e < MIN_EXP) {

        // Zero.
        n.c = [n.e = 0];
      } else {
        n.e = e;
        n.c = c;
      }

      return n;
    }


    // Handle values that fail the validity test in BigNumber.
    parseNumeric = (function () {
      var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i,
        dotAfter = /^([^.]+)\.$/,
        dotBefore = /^\.([^.]+)$/,
        isInfinityOrNaN = /^-?(Infinity|NaN)$/,
        whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;

      return function (x, str, isNum, b) {
        var base,
          s = isNum ? str : str.replace(whitespaceOrPlus, '');

        // No exception on ±Infinity or NaN.
        if (isInfinityOrNaN.test(s)) {
          x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
        } else {
          if (!isNum) {

            // basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i
            s = s.replace(basePrefix, function (m, p1, p2) {
              base = (p2 = p2.toLowerCase()) == 'x' ? 16 : p2 == 'b' ? 2 : 8;
              return !b || b == base ? p1 : m;
            });

            if (b) {
              base = b;

              // E.g. '1.' to '1', '.1' to '0.1'
              s = s.replace(dotAfter, '$1').replace(dotBefore, '0.$1');
            }

            if (str != s) return new BigNumber(s, base);
          }

          // '[BigNumber Error] Not a number: {n}'
          // '[BigNumber Error] Not a base {b} number: {n}'
          if (BigNumber.DEBUG) {
            throw Error
              (bignumberError + 'Not a' + (b ? ' base ' + b : '') + ' number: ' + str);
          }

          // NaN
          x.s = null;
        }

        x.c = x.e = null;
      }
    })();


    /*
     * Round x to sd significant digits using rounding mode rm. Check for over/under-flow.
     * If r is truthy, it is known that there are more digits after the rounding digit.
     */
    function round(x, sd, rm, r) {
      var d, i, j, k, n, ni, rd,
        xc = x.c,
        pows10 = POWS_TEN;

      // if x is not Infinity or NaN...
      if (xc) {

        // rd is the rounding digit, i.e. the digit after the digit that may be rounded up.
        // n is a base 1e14 number, the value of the element of array x.c containing rd.
        // ni is the index of n within x.c.
        // d is the number of digits of n.
        // i is the index of rd within n including leading zeros.
        // j is the actual index of rd within n (if < 0, rd is a leading zero).
        out: {

          // Get the number of digits of the first element of xc.
          for (d = 1, k = xc[0]; k >= 10; k /= 10, d++);
          i = sd - d;

          // If the rounding digit is in the first element of xc...
          if (i < 0) {
            i += LOG_BASE;
            j = sd;
            n = xc[ni = 0];

            // Get the rounding digit at index j of n.
            rd = n / pows10[d - j - 1] % 10 | 0;
          } else {
            ni = mathceil((i + 1) / LOG_BASE);

            if (ni >= xc.length) {

              if (r) {

                // Needed by sqrt.
                for (; xc.length <= ni; xc.push(0));
                n = rd = 0;
                d = 1;
                i %= LOG_BASE;
                j = i - LOG_BASE + 1;
              } else {
                break out;
              }
            } else {
              n = k = xc[ni];

              // Get the number of digits of n.
              for (d = 1; k >= 10; k /= 10, d++);

              // Get the index of rd within n.
              i %= LOG_BASE;

              // Get the index of rd within n, adjusted for leading zeros.
              // The number of leading zeros of n is given by LOG_BASE - d.
              j = i - LOG_BASE + d;

              // Get the rounding digit at index j of n.
              rd = j < 0 ? 0 : n / pows10[d - j - 1] % 10 | 0;
            }
          }

          r = r || sd < 0 ||

          // Are there any non-zero digits after the rounding digit?
          // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
          // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
           xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);

          r = rm < 4
           ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
           : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10) & 1 ||
             rm == (x.s < 0 ? 8 : 7));

          if (sd < 1 || !xc[0]) {
            xc.length = 0;

            if (r) {

              // Convert sd to decimal places.
              sd -= x.e + 1;

              // 1, 0.1, 0.01, 0.001, 0.0001 etc.
              xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
              x.e = -sd || 0;
            } else {

              // Zero.
              xc[0] = x.e = 0;
            }

            return x;
          }

          // Remove excess digits.
          if (i == 0) {
            xc.length = ni;
            k = 1;
            ni--;
          } else {
            xc.length = ni + 1;
            k = pows10[LOG_BASE - i];

            // E.g. 56700 becomes 56000 if 7 is the rounding digit.
            // j > 0 means i > number of leading zeros of n.
            xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
          }

          // Round up?
          if (r) {

            for (; ;) {

              // If the digit to be rounded up is in the first element of xc...
              if (ni == 0) {

                // i will be the length of xc[0] before k is added.
                for (i = 1, j = xc[0]; j >= 10; j /= 10, i++);
                j = xc[0] += k;
                for (k = 1; j >= 10; j /= 10, k++);

                // if i != k the length has increased.
                if (i != k) {
                  x.e++;
                  if (xc[0] == BASE) xc[0] = 1;
                }

                break;
              } else {
                xc[ni] += k;
                if (xc[ni] != BASE) break;
                xc[ni--] = 0;
                k = 1;
              }
            }
          }

          // Remove trailing zeros.
          for (i = xc.length; xc[--i] === 0; xc.pop());
        }

        // Overflow? Infinity.
        if (x.e > MAX_EXP) {
          x.c = x.e = null;

        // Underflow? Zero.
        } else if (x.e < MIN_EXP) {
          x.c = [x.e = 0];
        }
      }

      return x;
    }


    function valueOf(n) {
      var str,
        e = n.e;

      if (e === null) return n.toString();

      str = coeffToString(n.c);

      str = e <= TO_EXP_NEG || e >= TO_EXP_POS
        ? toExponential(str, e)
        : toFixedPoint(str, e, '0');

      return n.s < 0 ? '-' + str : str;
    }


    // PROTOTYPE/INSTANCE METHODS


    /*
     * Return a new BigNumber whose value is the absolute value of this BigNumber.
     */
    P.absoluteValue = P.abs = function () {
      var x = new BigNumber(this);
      if (x.s < 0) x.s = 1;
      return x;
    };


    /*
     * Return
     *   1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
     *   -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
     *   0 if they have the same value,
     *   or null if the value of either is NaN.
     */
    P.comparedTo = function (y, b) {
      return compare(this, new BigNumber(y, b));
    };


    /*
     * If dp is undefined or null or true or false, return the number of decimal places of the
     * value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     *
     * Otherwise, if dp is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of dp decimal places using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * [dp] {number} Decimal places: integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.decimalPlaces = P.dp = function (dp, rm) {
      var c, n, v,
        x = this;

      if (dp != null) {
        intCheck(dp, 0, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), dp + x.e + 1, rm);
      }

      if (!(c = x.c)) return null;
      n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;

      // Subtract the number of trailing zeros of the last number.
      if (v = c[v]) for (; v % 10 == 0; v /= 10, n--);
      if (n < 0) n = 0;

      return n;
    };


    /*
     *  n / 0 = I
     *  n / N = N
     *  n / I = 0
     *  0 / n = 0
     *  0 / 0 = N
     *  0 / N = N
     *  0 / I = 0
     *  N / n = N
     *  N / 0 = N
     *  N / N = N
     *  N / I = N
     *  I / n = I
     *  I / 0 = I
     *  I / N = N
     *  I / I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber divided by the value of
     * BigNumber(y, b), rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.dividedBy = P.div = function (y, b) {
      return div(this, new BigNumber(y, b), DECIMAL_PLACES, ROUNDING_MODE);
    };


    /*
     * Return a new BigNumber whose value is the integer part of dividing the value of this
     * BigNumber by the value of BigNumber(y, b).
     */
    P.dividedToIntegerBy = P.idiv = function (y, b) {
      return div(this, new BigNumber(y, b), 0, 1);
    };


    /*
     * Return a BigNumber whose value is the value of this BigNumber exponentiated by n.
     *
     * If m is present, return the result modulo m.
     * If n is negative round according to DECIMAL_PLACES and ROUNDING_MODE.
     * If POW_PRECISION is non-zero and m is not present, round to POW_PRECISION using ROUNDING_MODE.
     *
     * The modular power operation works efficiently when x, n, and m are integers, otherwise it
     * is equivalent to calculating x.exponentiatedBy(n).modulo(m) with a POW_PRECISION of 0.
     *
     * n {number|string|BigNumber} The exponent. An integer.
     * [m] {number|string|BigNumber} The modulus.
     *
     * '[BigNumber Error] Exponent not an integer: {n}'
     */
    P.exponentiatedBy = P.pow = function (n, m) {
      var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y,
        x = this;

      n = new BigNumber(n);

      // Allow NaN and ±Infinity, but not other non-integers.
      if (n.c && !n.isInteger()) {
        throw Error
          (bignumberError + 'Exponent not an integer: ' + valueOf(n));
      }

      if (m != null) m = new BigNumber(m);

      // Exponent of MAX_SAFE_INTEGER is 15.
      nIsBig = n.e > 14;

      // If x is NaN, ±Infinity, ±0 or ±1, or n is ±Infinity, NaN or ±0.
      if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {

        // The sign of the result of pow when x is negative depends on the evenness of n.
        // If +n overflows to ±Infinity, the evenness of n would be not be known.
        y = new BigNumber(Math.pow(+valueOf(x), nIsBig ? 2 - isOdd(n) : +valueOf(n)));
        return m ? y.mod(m) : y;
      }

      nIsNeg = n.s < 0;

      if (m) {

        // x % m returns NaN if abs(m) is zero, or m is NaN.
        if (m.c ? !m.c[0] : !m.s) return new BigNumber(NaN);

        isModExp = !nIsNeg && x.isInteger() && m.isInteger();

        if (isModExp) x = x.mod(m);

      // Overflow to ±Infinity: >=2**1e10 or >=1.0000024**1e15.
      // Underflow to ±0: <=0.79**1e10 or <=0.9999975**1e15.
      } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0
        // [1, 240000000]
        ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7
        // [80000000000000]  [99999750000000]
        : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {

        // If x is negative and n is odd, k = -0, else k = 0.
        k = x.s < 0 && isOdd(n) ? -0 : 0;

        // If x >= 1, k = ±Infinity.
        if (x.e > -1) k = 1 / k;

        // If n is negative return ±0, else return ±Infinity.
        return new BigNumber(nIsNeg ? 1 / k : k);

      } else if (POW_PRECISION) {

        // Truncating each coefficient array to a length of k after each multiplication
        // equates to truncating significant digits to POW_PRECISION + [28, 41],
        // i.e. there will be a minimum of 28 guard digits retained.
        k = mathceil(POW_PRECISION / LOG_BASE + 2);
      }

      if (nIsBig) {
        half = new BigNumber(0.5);
        if (nIsNeg) n.s = 1;
        nIsOdd = isOdd(n);
      } else {
        i = Math.abs(+valueOf(n));
        nIsOdd = i % 2;
      }

      y = new BigNumber(ONE);

      // Performs 54 loop iterations for n of 9007199254740991.
      for (; ;) {

        if (nIsOdd) {
          y = y.times(x);
          if (!y.c) break;

          if (k) {
            if (y.c.length > k) y.c.length = k;
          } else if (isModExp) {
            y = y.mod(m);    //y = y.minus(div(y, m, 0, MODULO_MODE).times(m));
          }
        }

        if (i) {
          i = mathfloor(i / 2);
          if (i === 0) break;
          nIsOdd = i % 2;
        } else {
          n = n.times(half);
          round(n, n.e + 1, 1);

          if (n.e > 14) {
            nIsOdd = isOdd(n);
          } else {
            i = +valueOf(n);
            if (i === 0) break;
            nIsOdd = i % 2;
          }
        }

        x = x.times(x);

        if (k) {
          if (x.c && x.c.length > k) x.c.length = k;
        } else if (isModExp) {
          x = x.mod(m);    //x = x.minus(div(x, m, 0, MODULO_MODE).times(m));
        }
      }

      if (isModExp) return y;
      if (nIsNeg) y = ONE.div(y);

      return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber rounded to an integer
     * using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {rm}'
     */
    P.integerValue = function (rm) {
      var n = new BigNumber(this);
      if (rm == null) rm = ROUNDING_MODE;
      else intCheck(rm, 0, 8);
      return round(n, n.e + 1, rm);
    };


    /*
     * Return true if the value of this BigNumber is equal to the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isEqualTo = P.eq = function (y, b) {
      return compare(this, new BigNumber(y, b)) === 0;
    };


    /*
     * Return true if the value of this BigNumber is a finite number, otherwise return false.
     */
    P.isFinite = function () {
      return !!this.c;
    };


    /*
     * Return true if the value of this BigNumber is greater than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isGreaterThan = P.gt = function (y, b) {
      return compare(this, new BigNumber(y, b)) > 0;
    };


    /*
     * Return true if the value of this BigNumber is greater than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isGreaterThanOrEqualTo = P.gte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === 1 || b === 0;

    };


    /*
     * Return true if the value of this BigNumber is an integer, otherwise return false.
     */
    P.isInteger = function () {
      return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
    };


    /*
     * Return true if the value of this BigNumber is less than the value of BigNumber(y, b),
     * otherwise return false.
     */
    P.isLessThan = P.lt = function (y, b) {
      return compare(this, new BigNumber(y, b)) < 0;
    };


    /*
     * Return true if the value of this BigNumber is less than or equal to the value of
     * BigNumber(y, b), otherwise return false.
     */
    P.isLessThanOrEqualTo = P.lte = function (y, b) {
      return (b = compare(this, new BigNumber(y, b))) === -1 || b === 0;
    };


    /*
     * Return true if the value of this BigNumber is NaN, otherwise return false.
     */
    P.isNaN = function () {
      return !this.s;
    };


    /*
     * Return true if the value of this BigNumber is negative, otherwise return false.
     */
    P.isNegative = function () {
      return this.s < 0;
    };


    /*
     * Return true if the value of this BigNumber is positive, otherwise return false.
     */
    P.isPositive = function () {
      return this.s > 0;
    };


    /*
     * Return true if the value of this BigNumber is 0 or -0, otherwise return false.
     */
    P.isZero = function () {
      return !!this.c && this.c[0] == 0;
    };


    /*
     *  n - 0 = n
     *  n - N = N
     *  n - I = -I
     *  0 - n = -n
     *  0 - 0 = 0
     *  0 - N = N
     *  0 - I = -I
     *  N - n = N
     *  N - 0 = N
     *  N - N = N
     *  N - I = N
     *  I - n = I
     *  I - 0 = I
     *  I - N = N
     *  I - I = N
     *
     * Return a new BigNumber whose value is the value of this BigNumber minus the value of
     * BigNumber(y, b).
     */
    P.minus = function (y, b) {
      var i, j, t, xLTy,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
      if (a != b) {
        y.s = -b;
        return x.plus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Either Infinity?
        if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber(yc ? x : NaN);

        // Either zero?
        if (!xc[0] || !yc[0]) {

          // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
          return yc[0] ? (y.s = -b, y) : new BigNumber(xc[0] ? x :

           // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
           ROUNDING_MODE == 3 ? -0 : 0);
        }
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Determine which is the bigger number.
      if (a = xe - ye) {

        if (xLTy = a < 0) {
          a = -a;
          t = xc;
        } else {
          ye = xe;
          t = yc;
        }

        t.reverse();

        // Prepend zeros to equalise exponents.
        for (b = a; b--; t.push(0));
        t.reverse();
      } else {

        // Exponents equal. Check digit by digit.
        j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;

        for (a = b = 0; b < j; b++) {

          if (xc[b] != yc[b]) {
            xLTy = xc[b] < yc[b];
            break;
          }
        }
      }

      // x < y? Point xc to the array of the bigger number.
      if (xLTy) t = xc, xc = yc, yc = t, y.s = -y.s;

      b = (j = yc.length) - (i = xc.length);

      // Append zeros to xc if shorter.
      // No need to add zeros to yc if shorter as subtract only needs to start at yc.length.
      if (b > 0) for (; b--; xc[i++] = 0);
      b = BASE - 1;

      // Subtract yc from xc.
      for (; j > a;) {

        if (xc[--j] < yc[j]) {
          for (i = j; i && !xc[--i]; xc[i] = b);
          --xc[i];
          xc[j] += BASE;
        }

        xc[j] -= yc[j];
      }

      // Remove leading zeros and adjust exponent accordingly.
      for (; xc[0] == 0; xc.splice(0, 1), --ye);

      // Zero?
      if (!xc[0]) {

        // Following IEEE 754 (2008) 6.3,
        // n - n = +0  but  n - n = -0  when rounding towards -Infinity.
        y.s = ROUNDING_MODE == 3 ? -1 : 1;
        y.c = [y.e = 0];
        return y;
      }

      // No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
      // for finite x and y.
      return normalise(y, xc, ye);
    };


    /*
     *   n % 0 =  N
     *   n % N =  N
     *   n % I =  n
     *   0 % n =  0
     *  -0 % n = -0
     *   0 % 0 =  N
     *   0 % N =  N
     *   0 % I =  0
     *   N % n =  N
     *   N % 0 =  N
     *   N % N =  N
     *   N % I =  N
     *   I % n =  N
     *   I % 0 =  N
     *   I % N =  N
     *   I % I =  N
     *
     * Return a new BigNumber whose value is the value of this BigNumber modulo the value of
     * BigNumber(y, b). The result depends on the value of MODULO_MODE.
     */
    P.modulo = P.mod = function (y, b) {
      var q, s,
        x = this;

      y = new BigNumber(y, b);

      // Return NaN if x is Infinity or NaN, or y is NaN or zero.
      if (!x.c || !y.s || y.c && !y.c[0]) {
        return new BigNumber(NaN);

      // Return x if y is Infinity or x is zero.
      } else if (!y.c || x.c && !x.c[0]) {
        return new BigNumber(x);
      }

      if (MODULO_MODE == 9) {

        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // r = x - qy    where  0 <= r < abs(y)
        s = y.s;
        y.s = 1;
        q = div(x, y, 0, 3);
        y.s = s;
        q.s *= s;
      } else {
        q = div(x, y, 0, MODULO_MODE);
      }

      y = x.minus(q.times(y));

      // To match JavaScript %, ensure sign of zero is sign of dividend.
      if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;

      return y;
    };


    /*
     *  n * 0 = 0
     *  n * N = N
     *  n * I = I
     *  0 * n = 0
     *  0 * 0 = 0
     *  0 * N = N
     *  0 * I = N
     *  N * n = N
     *  N * 0 = N
     *  N * N = N
     *  N * I = N
     *  I * n = I
     *  I * 0 = N
     *  I * N = N
     *  I * I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber multiplied by the value
     * of BigNumber(y, b).
     */
    P.multipliedBy = P.times = function (y, b) {
      var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc,
        base, sqrtBase,
        x = this,
        xc = x.c,
        yc = (y = new BigNumber(y, b)).c;

      // Either NaN, ±Infinity or ±0?
      if (!xc || !yc || !xc[0] || !yc[0]) {

        // Return NaN if either is NaN, or one is 0 and the other is Infinity.
        if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
          y.c = y.e = y.s = null;
        } else {
          y.s *= x.s;

          // Return ±Infinity if either is ±Infinity.
          if (!xc || !yc) {
            y.c = y.e = null;

          // Return ±0 if either is ±0.
          } else {
            y.c = [0];
            y.e = 0;
          }
        }

        return y;
      }

      e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
      y.s *= x.s;
      xcL = xc.length;
      ycL = yc.length;

      // Ensure xc points to longer array and xcL to its length.
      if (xcL < ycL) zc = xc, xc = yc, yc = zc, i = xcL, xcL = ycL, ycL = i;

      // Initialise the result array with zeros.
      for (i = xcL + ycL, zc = []; i--; zc.push(0));

      base = BASE;
      sqrtBase = SQRT_BASE;

      for (i = ycL; --i >= 0;) {
        c = 0;
        ylo = yc[i] % sqrtBase;
        yhi = yc[i] / sqrtBase | 0;

        for (k = xcL, j = i + k; j > i;) {
          xlo = xc[--k] % sqrtBase;
          xhi = xc[k] / sqrtBase | 0;
          m = yhi * xlo + xhi * ylo;
          xlo = ylo * xlo + ((m % sqrtBase) * sqrtBase) + zc[j] + c;
          c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
          zc[j--] = xlo % base;
        }

        zc[j] = c;
      }

      if (c) {
        ++e;
      } else {
        zc.splice(0, 1);
      }

      return normalise(y, zc, e);
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber negated,
     * i.e. multiplied by -1.
     */
    P.negated = function () {
      var x = new BigNumber(this);
      x.s = -x.s || null;
      return x;
    };


    /*
     *  n + 0 = n
     *  n + N = N
     *  n + I = I
     *  0 + n = n
     *  0 + 0 = 0
     *  0 + N = N
     *  0 + I = I
     *  N + n = N
     *  N + 0 = N
     *  N + N = N
     *  N + I = N
     *  I + n = I
     *  I + 0 = I
     *  I + N = N
     *  I + I = I
     *
     * Return a new BigNumber whose value is the value of this BigNumber plus the value of
     * BigNumber(y, b).
     */
    P.plus = function (y, b) {
      var t,
        x = this,
        a = x.s;

      y = new BigNumber(y, b);
      b = y.s;

      // Either NaN?
      if (!a || !b) return new BigNumber(NaN);

      // Signs differ?
       if (a != b) {
        y.s = -b;
        return x.minus(y);
      }

      var xe = x.e / LOG_BASE,
        ye = y.e / LOG_BASE,
        xc = x.c,
        yc = y.c;

      if (!xe || !ye) {

        // Return ±Infinity if either ±Infinity.
        if (!xc || !yc) return new BigNumber(a / 0);

        // Either zero?
        // Return y if y is non-zero, x if x is non-zero, or zero if both are zero.
        if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber(xc[0] ? x : a * 0);
      }

      xe = bitFloor(xe);
      ye = bitFloor(ye);
      xc = xc.slice();

      // Prepend zeros to equalise exponents. Faster to use reverse then do unshifts.
      if (a = xe - ye) {
        if (a > 0) {
          ye = xe;
          t = yc;
        } else {
          a = -a;
          t = xc;
        }

        t.reverse();
        for (; a--; t.push(0));
        t.reverse();
      }

      a = xc.length;
      b = yc.length;

      // Point xc to the longer array, and b to the shorter length.
      if (a - b < 0) t = yc, yc = xc, xc = t, b = a;

      // Only start adding at yc.length - 1 as the further digits of xc can be ignored.
      for (a = 0; b;) {
        a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
        xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
      }

      if (a) {
        xc = [a].concat(xc);
        ++ye;
      }

      // No need to check for zero, as +x + +y != 0 && -x + -y != 0
      // ye = MAX_EXP + 1 possible
      return normalise(y, xc, ye);
    };


    /*
     * If sd is undefined or null or true or false, return the number of significant digits of
     * the value of this BigNumber, or null if the value of this BigNumber is ±Infinity or NaN.
     * If sd is true include integer-part trailing zeros in the count.
     *
     * Otherwise, if sd is a number, return a new BigNumber whose value is the value of this
     * BigNumber rounded to a maximum of sd significant digits using rounding mode rm, or
     * ROUNDING_MODE if rm is omitted.
     *
     * sd {number|boolean} number: significant digits: integer, 1 to MAX inclusive.
     *                     boolean: whether to count integer-part trailing zeros: true or false.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.precision = P.sd = function (sd, rm) {
      var c, n, v,
        x = this;

      if (sd != null && sd !== !!sd) {
        intCheck(sd, 1, MAX);
        if (rm == null) rm = ROUNDING_MODE;
        else intCheck(rm, 0, 8);

        return round(new BigNumber(x), sd, rm);
      }

      if (!(c = x.c)) return null;
      v = c.length - 1;
      n = v * LOG_BASE + 1;

      if (v = c[v]) {

        // Subtract the number of trailing zeros of the last element.
        for (; v % 10 == 0; v /= 10, n--);

        // Add the number of digits of the first element.
        for (v = c[0]; v >= 10; v /= 10, n++);
      }

      if (sd && x.e + 1 > n) n = x.e + 1;

      return n;
    };


    /*
     * Return a new BigNumber whose value is the value of this BigNumber shifted by k places
     * (powers of 10). Shift to the right if n > 0, and to the left if n < 0.
     *
     * k {number} Integer, -MAX_SAFE_INTEGER to MAX_SAFE_INTEGER inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {k}'
     */
    P.shiftedBy = function (k) {
      intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
      return this.times('1e' + k);
    };


    /*
     *  sqrt(-n) =  N
     *  sqrt(N) =  N
     *  sqrt(-I) =  N
     *  sqrt(I) =  I
     *  sqrt(0) =  0
     *  sqrt(-0) = -0
     *
     * Return a new BigNumber whose value is the square root of the value of this BigNumber,
     * rounded according to DECIMAL_PLACES and ROUNDING_MODE.
     */
    P.squareRoot = P.sqrt = function () {
      var m, n, r, rep, t,
        x = this,
        c = x.c,
        s = x.s,
        e = x.e,
        dp = DECIMAL_PLACES + 4,
        half = new BigNumber('0.5');

      // Negative/NaN/Infinity/zero?
      if (s !== 1 || !c || !c[0]) {
        return new BigNumber(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
      }

      // Initial estimate.
      s = Math.sqrt(+valueOf(x));

      // Math.sqrt underflow/overflow?
      // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
      if (s == 0 || s == 1 / 0) {
        n = coeffToString(c);
        if ((n.length + e) % 2 == 0) n += '0';
        s = Math.sqrt(+n);
        e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);

        if (s == 1 / 0) {
          n = '1e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new BigNumber(n);
      } else {
        r = new BigNumber(s + '');
      }

      // Check for zero.
      // r could be zero if MIN_EXP is changed after the this value was created.
      // This would cause a division by zero (x/t) and hence Infinity below, which would cause
      // coeffToString to throw.
      if (r.c[0]) {
        e = r.e;
        s = e + dp;
        if (s < 3) s = 0;

        // Newton-Raphson iteration.
        for (; ;) {
          t = r;
          r = half.times(t.plus(div(x, t, dp, 1)));

          if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {

            // The exponent of r may here be one less than the final result exponent,
            // e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust s so the rounding digits
            // are indexed correctly.
            if (r.e < e) --s;
            n = n.slice(s - 3, s + 1);

            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits
            // are 9999 or 4999 (i.e. approaching a rounding boundary) continue the
            // iteration.
            if (n == '9999' || !rep && n == '4999') {

              // On the first iteration only, check to see if rounding up gives the
              // exact result as the nines may infinitely repeat.
              if (!rep) {
                round(t, t.e + DECIMAL_PLACES + 2, 0);

                if (t.times(t).eq(x)) {
                  r = t;
                  break;
                }
              }

              dp += 4;
              s += 4;
              rep = 1;
            } else {

              // If rounding digits are null, 0{0,4} or 50{0,3}, check for exact
              // result. If not, then there are further digits and m will be truthy.
              if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

                // Truncate to the first rounding digit.
                round(r, r.e + DECIMAL_PLACES + 2, 1);
                m = !r.times(r).eq(x);
              }

              break;
            }
          }
        }
      }

      return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
    };


    /*
     * Return a string representing the value of this BigNumber in exponential notation and
     * rounded using ROUNDING_MODE to dp fixed decimal places.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toExponential = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp++;
      }
      return format(this, dp, rm, 1);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounding
     * to dp fixed decimal places using rounding mode rm, or ROUNDING_MODE if rm is omitted.
     *
     * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
     * but e.g. (-0.00001).toFixed(0) is '-0'.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     */
    P.toFixed = function (dp, rm) {
      if (dp != null) {
        intCheck(dp, 0, MAX);
        dp = dp + this.e + 1;
      }
      return format(this, dp, rm);
    };


    /*
     * Return a string representing the value of this BigNumber in fixed-point notation rounded
     * using rm or ROUNDING_MODE to dp decimal places, and formatted according to the properties
     * of the format or FORMAT object (see BigNumber.set).
     *
     * The formatting object may contain some or all of the properties shown below.
     *
     * FORMAT = {
     *   prefix: '',
     *   groupSize: 3,
     *   secondaryGroupSize: 0,
     *   groupSeparator: ',',
     *   decimalSeparator: '.',
     *   fractionGroupSize: 0,
     *   fractionGroupSeparator: '\xA0',      // non-breaking space
     *   suffix: ''
     * };
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     * [format] {object} Formatting options. See FORMAT pbject above.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {dp|rm}'
     * '[BigNumber Error] Argument not an object: {format}'
     */
    P.toFormat = function (dp, rm, format) {
      var str,
        x = this;

      if (format == null) {
        if (dp != null && rm && typeof rm == 'object') {
          format = rm;
          rm = null;
        } else if (dp && typeof dp == 'object') {
          format = dp;
          dp = rm = null;
        } else {
          format = FORMAT;
        }
      } else if (typeof format != 'object') {
        throw Error
          (bignumberError + 'Argument not an object: ' + format);
      }

      str = x.toFixed(dp, rm);

      if (x.c) {
        var i,
          arr = str.split('.'),
          g1 = +format.groupSize,
          g2 = +format.secondaryGroupSize,
          groupSeparator = format.groupSeparator || '',
          intPart = arr[0],
          fractionPart = arr[1],
          isNeg = x.s < 0,
          intDigits = isNeg ? intPart.slice(1) : intPart,
          len = intDigits.length;

        if (g2) i = g1, g1 = g2, g2 = i, len -= i;

        if (g1 > 0 && len > 0) {
          i = len % g1 || g1;
          intPart = intDigits.substr(0, i);
          for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
          if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
          if (isNeg) intPart = '-' + intPart;
        }

        str = fractionPart
         ? intPart + (format.decimalSeparator || '') + ((g2 = +format.fractionGroupSize)
          ? fractionPart.replace(new RegExp('\\d{' + g2 + '}\\B', 'g'),
           '$&' + (format.fractionGroupSeparator || ''))
          : fractionPart)
         : intPart;
      }

      return (format.prefix || '') + str + (format.suffix || '');
    };


    /*
     * Return an array of two BigNumbers representing the value of this BigNumber as a simple
     * fraction with an integer numerator and an integer denominator.
     * The denominator will be a positive non-zero value less than or equal to the specified
     * maximum denominator. If a maximum denominator is not specified, the denominator will be
     * the lowest value necessary to represent the number exactly.
     *
     * [md] {number|string|BigNumber} Integer >= 1, or Infinity. The maximum denominator.
     *
     * '[BigNumber Error] Argument {not an integer|out of range} : {md}'
     */
    P.toFraction = function (md) {
      var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s,
        x = this,
        xc = x.c;

      if (md != null) {
        n = new BigNumber(md);

        // Throw if md is less than one or is not an integer, unless it is Infinity.
        if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
          throw Error
            (bignumberError + 'Argument ' +
              (n.isInteger() ? 'out of range: ' : 'not an integer: ') + valueOf(n));
        }
      }

      if (!xc) return new BigNumber(x);

      d = new BigNumber(ONE);
      n1 = d0 = new BigNumber(ONE);
      d1 = n0 = new BigNumber(ONE);
      s = coeffToString(xc);

      // Determine initial denominator.
      // d is a power of 10 and the minimum max denominator that specifies the value exactly.
      e = d.e = s.length - x.e - 1;
      d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
      md = !md || n.comparedTo(d) > 0 ? (e > 0 ? d : n1) : n;

      exp = MAX_EXP;
      MAX_EXP = 1 / 0;
      n = new BigNumber(s);

      // n0 = d1 = 0
      n0.c[0] = 0;

      for (; ;)  {
        q = div(n, d, 0, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.comparedTo(md) == 1) break;
        d0 = d1;
        d1 = d2;
        n1 = n0.plus(q.times(d2 = n1));
        n0 = d2;
        d = n.minus(q.times(d2 = d));
        n = d2;
      }

      d2 = div(md.minus(d0), d1, 0, 1);
      n0 = n0.plus(d2.times(n1));
      d0 = d0.plus(d2.times(d1));
      n0.s = n1.s = x.s;
      e = e * 2;

      // Determine which fraction is closer to x, n0/d0 or n1/d1
      r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
          div(n0, d0, e, ROUNDING_MODE).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];

      MAX_EXP = exp;

      return r;
    };


    /*
     * Return the value of this BigNumber converted to a number primitive.
     */
    P.toNumber = function () {
      return +valueOf(this);
    };


    /*
     * Return a string representing the value of this BigNumber rounded to sd significant digits
     * using rounding mode rm or ROUNDING_MODE. If sd is less than the number of digits
     * necessary to represent the integer part of the value in fixed-point notation, then use
     * exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * '[BigNumber Error] Argument {not a primitive number|not an integer|out of range}: {sd|rm}'
     */
    P.toPrecision = function (sd, rm) {
      if (sd != null) intCheck(sd, 1, MAX);
      return format(this, sd, rm, 2);
    };


    /*
     * Return a string representing the value of this BigNumber in base b, or base 10 if b is
     * omitted. If a base is specified, including base 10, round according to DECIMAL_PLACES and
     * ROUNDING_MODE. If a base is not specified, and this BigNumber has a positive exponent
     * that is equal to or greater than TO_EXP_POS, or a negative exponent equal to or less than
     * TO_EXP_NEG, return exponential notation.
     *
     * [b] {number} Integer, 2 to ALPHABET.length inclusive.
     *
     * '[BigNumber Error] Base {not a primitive number|not an integer|out of range}: {b}'
     */
    P.toString = function (b) {
      var str,
        n = this,
        s = n.s,
        e = n.e;

      // Infinity or NaN?
      if (e === null) {
        if (s) {
          str = 'Infinity';
          if (s < 0) str = '-' + str;
        } else {
          str = 'NaN';
        }
      } else {
        if (b == null) {
          str = e <= TO_EXP_NEG || e >= TO_EXP_POS
           ? toExponential(coeffToString(n.c), e)
           : toFixedPoint(coeffToString(n.c), e, '0');
        } else if (b === 10) {
          n = round(new BigNumber(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
          str = toFixedPoint(coeffToString(n.c), n.e, '0');
        } else {
          intCheck(b, 2, ALPHABET.length, 'Base');
          str = convertBase(toFixedPoint(coeffToString(n.c), e, '0'), 10, b, s, true);
        }

        if (s < 0 && n.c[0]) str = '-' + str;
      }

      return str;
    };


    /*
     * Return as toString, but do not accept a base argument, and include the minus sign for
     * negative zero.
     */
    P.valueOf = P.toJSON = function () {
      return valueOf(this);
    };


    P._isBigNumber = true;

    if (hasSymbol) {
      P[Symbol.toStringTag] = 'BigNumber';

      // Node.js v10.12.0+
      P[Symbol.for('nodejs.util.inspect.custom')] = P.valueOf;
    }

    if (configObject != null) BigNumber.set(configObject);

    return BigNumber;
  }


  // PRIVATE HELPER FUNCTIONS

  // These functions don't need access to variables,
  // e.g. DECIMAL_PLACES, in the scope of the `clone` function above.


  function bitFloor(n) {
    var i = n | 0;
    return n > 0 || n === i ? i : i - 1;
  }


  // Return a coefficient array as a string of base 10 digits.
  function coeffToString(a) {
    var s, z,
      i = 1,
      j = a.length,
      r = a[0] + '';

    for (; i < j;) {
      s = a[i++] + '';
      z = LOG_BASE - s.length;
      for (; z--; s = '0' + s);
      r += s;
    }

    // Determine trailing zeros.
    for (j = r.length; r.charCodeAt(--j) === 48;);

    return r.slice(0, j + 1 || 1);
  }


  // Compare the value of BigNumbers x and y.
  function compare(x, y) {
    var a, b,
      xc = x.c,
      yc = y.c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either NaN?
    if (!i || !j) return null;

    a = xc && !xc[0];
    b = yc && !yc[0];

    // Either zero?
    if (a || b) return a ? b ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    a = i < 0;
    b = k == l;

    // Either Infinity?
    if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;

    // Compare exponents.
    if (!b) return k > l ^ a ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;

    // Compare lengths.
    return k == l ? 0 : k > l ^ a ? 1 : -1;
  }


  /*
   * Check that n is a primitive number, an integer, and in range, otherwise throw.
   */
  function intCheck(n, min, max, name) {
    if (n < min || n > max || n !== mathfloor(n)) {
      throw Error
       (bignumberError + (name || 'Argument') + (typeof n == 'number'
         ? n < min || n > max ? ' out of range: ' : ' not an integer: '
         : ' not a primitive number: ') + String(n));
    }
  }


  // Assumes finite n.
  function isOdd(n) {
    var k = n.c.length - 1;
    return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
  }


  function toExponential(str, e) {
    return (str.length > 1 ? str.charAt(0) + '.' + str.slice(1) : str) +
     (e < 0 ? 'e' : 'e+') + e;
  }


  function toFixedPoint(str, e, z) {
    var len, zs;

    // Negative exponent?
    if (e < 0) {

      // Prepend zeros.
      for (zs = z + '.'; ++e; zs += z);
      str = zs + str;

    // Positive exponent
    } else {
      len = str.length;

      // Append zeros.
      if (++e > len) {
        for (zs = z, e -= len; --e; zs += z);
        str += zs;
      } else if (e < len) {
        str = str.slice(0, e) + '.' + str.slice(e);
      }
    }

    return str;
  }


  // EXPORT


  BigNumber = clone();
  BigNumber['default'] = BigNumber.BigNumber = BigNumber;

  // AMD.
  if (typeof define == 'function' && define.amd) {
    define(function () { return BigNumber; });

  // Node.js and other environments that support module.exports.
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = BigNumber;

  // Browser.
  } else {
    if (!globalObject) {
      globalObject = typeof self != 'undefined' && self ? self : window;
    }

    globalObject.BigNumber = BigNumber;
  }
})(this);

},{}],2:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
module.exports = {
  languageTag: "en-US",
  delimiters: {
    thousands: ",",
    decimal: "."
  },
  abbreviations: {
    thousand: "k",
    million: "m",
    billion: "b",
    trillion: "t"
  },
  spaceSeparated: false,
  ordinal: function ordinal(number) {
    var b = number % 10;
    return ~~(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
  },
  bytes: {
    binarySuffixes: ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"],
    decimalSuffixes: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  },
  currency: {
    symbol: "$",
    position: "prefix",
    code: "USD"
  },
  currencyFormat: {
    thousandSeparated: true,
    totalLength: 4,
    spaceSeparated: true,
    spaceSeparatedCurrency: true
  },
  formats: {
    fourDigits: {
      totalLength: 4,
      spaceSeparated: true
    },
    fullWithTwoDecimals: {
      output: "currency",
      thousandSeparated: true,
      mantissa: 2
    },
    fullWithTwoDecimalsNoCurrency: {
      thousandSeparated: true,
      mantissa: 2
    },
    fullWithNoDecimals: {
      output: "currency",
      thousandSeparated: true,
      mantissa: 0
    }
  }
};

},{}],3:[function(require,module,exports){
"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var globalState = require("./globalState");

var validating = require("./validating");

var parsing = require("./parsing");

var powers = {
  trillion: Math.pow(10, 12),
  billion: Math.pow(10, 9),
  million: Math.pow(10, 6),
  thousand: Math.pow(10, 3)
};
var defaultOptions = {
  totalLength: 0,
  characteristic: 0,
  forceAverage: false,
  average: false,
  mantissa: -1,
  optionalMantissa: true,
  thousandSeparated: false,
  spaceSeparated: false,
  negative: "sign",
  forceSign: false,
  roundingFunction: Math.round,
  spaceSeparatedAbbreviation: false
};

var _globalState$currentB = globalState.currentBytes(),
    binarySuffixes = _globalState$currentB.binarySuffixes,
    decimalSuffixes = _globalState$currentB.decimalSuffixes;

var bytes = {
  general: {
    scale: 1024,
    suffixes: decimalSuffixes,
    marker: "bd"
  },
  binary: {
    scale: 1024,
    suffixes: binarySuffixes,
    marker: "b"
  },
  decimal: {
    scale: 1000,
    suffixes: decimalSuffixes,
    marker: "d"
  }
};
/**
 * Entry point. Format the provided INSTANCE according to the PROVIDEDFORMAT.
 * This method ensure the prefix and postfix are added as the last step.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {NumbroFormat|string} [providedFormat] - specification for formatting
 * @param numbro - the numbro singleton
 * @return {string}
 */

function _format(instance) {
  var providedFormat = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var numbro = arguments.length > 2 ? arguments[2] : undefined;

  if (typeof providedFormat === "string") {
    providedFormat = parsing.parseFormat(providedFormat);
  }

  var valid = validating.validateFormat(providedFormat);

  if (!valid) {
    return "ERROR: invalid format";
  }

  var prefix = providedFormat.prefix || "";
  var postfix = providedFormat.postfix || "";
  var output = formatNumbro(instance, providedFormat, numbro);
  output = insertPrefix(output, prefix);
  output = insertPostfix(output, postfix);
  return output;
}
/**
 * Format the provided INSTANCE according to the PROVIDEDFORMAT.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param numbro - the numbro singleton
 * @return {string}
 */


function formatNumbro(instance, providedFormat, numbro) {
  switch (providedFormat.output) {
    case "currency":
      {
        providedFormat = formatOrDefault(providedFormat, globalState.currentCurrencyDefaultFormat());
        return formatCurrency(instance, providedFormat, globalState, numbro);
      }

    case "percent":
      {
        providedFormat = formatOrDefault(providedFormat, globalState.currentPercentageDefaultFormat());
        return formatPercentage(instance, providedFormat, globalState, numbro);
      }

    case "byte":
      providedFormat = formatOrDefault(providedFormat, globalState.currentByteDefaultFormat());
      return formatByte(instance, providedFormat, globalState, numbro);

    case "time":
      providedFormat = formatOrDefault(providedFormat, globalState.currentTimeDefaultFormat());
      return formatTime(instance, providedFormat, globalState, numbro);

    case "ordinal":
      providedFormat = formatOrDefault(providedFormat, globalState.currentOrdinalDefaultFormat());
      return formatOrdinal(instance, providedFormat, globalState, numbro);

    case "number":
    default:
      return formatNumber({
        instance: instance,
        providedFormat: providedFormat,
        numbro: numbro
      });
  }
}
/**
 * Get the decimal byte unit (MB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1000).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */


function _getDecimalByteUnit(instance) {
  var data = bytes.decimal;
  return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}
/**
 * Get the binary byte unit (MiB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1024).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */


function _getBinaryByteUnit(instance) {
  var data = bytes.binary;
  return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}
/**
 * Get the decimal byte unit (MB) for the provided numbro INSTANCE.
 * We go from one unit to another using the decimal system (1024).
 *
 * @param {Numbro} instance - numbro instance to compute
 * @return {String}
 */


function _getByteUnit(instance) {
  var data = bytes.general;
  return getFormatByteUnits(instance._value, data.suffixes, data.scale).suffix;
}
/**
 * Return the value and the suffix computed in byte.
 * It uses the SUFFIXES and the SCALE provided.
 *
 * @param {number} value - Number to format
 * @param {[String]} suffixes - List of suffixes
 * @param {number} scale - Number in-between two units
 * @return {{value: Number, suffix: String}}
 */


function getFormatByteUnits(value, suffixes, scale) {
  var suffix = suffixes[0];
  var abs = Math.abs(value);

  if (abs >= scale) {
    for (var power = 1; power < suffixes.length; ++power) {
      var min = Math.pow(scale, power);
      var max = Math.pow(scale, power + 1);

      if (abs >= min && abs < max) {
        suffix = suffixes[power];
        value = value / min;
        break;
      }
    } // values greater than or equal to [scale] YB never set the suffix


    if (suffix === suffixes[0]) {
      value = value / Math.pow(scale, suffixes.length - 1);
      suffix = suffixes[suffixes.length - 1];
    }
  }

  return {
    value: value,
    suffix: suffix
  };
}
/**
 * Format the provided INSTANCE as bytes using the PROVIDEDFORMAT, and STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param numbro - the numbro singleton
 * @return {string}
 */


function formatByte(instance, providedFormat, state, numbro) {
  var base = providedFormat.base || "binary";
  var options = Object.assign({}, defaultOptions, providedFormat);

  var _state$currentBytes = state.currentBytes(),
      localBinarySuffixes = _state$currentBytes.binarySuffixes,
      localDecimalSuffixes = _state$currentBytes.decimalSuffixes;

  var localBytes = {
    general: {
      scale: 1024,
      suffixes: localDecimalSuffixes || decimalSuffixes,
      marker: "bd"
    },
    binary: {
      scale: 1024,
      suffixes: localBinarySuffixes || binarySuffixes,
      marker: "b"
    },
    decimal: {
      scale: 1000,
      suffixes: localDecimalSuffixes || decimalSuffixes,
      marker: "d"
    }
  };
  var baseInfo = localBytes[base];

  var _getFormatByteUnits = getFormatByteUnits(instance._value, baseInfo.suffixes, baseInfo.scale),
      value = _getFormatByteUnits.value,
      suffix = _getFormatByteUnits.suffix;

  var output = formatNumber({
    instance: numbro(value),
    providedFormat: providedFormat,
    state: state,
    defaults: state.currentByteDefaultFormat()
  });
  return "".concat(output).concat(options.spaceSeparated ? " " : "").concat(suffix);
}
/**
 * Format the provided INSTANCE as an ordinal using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @return {string}
 */


function formatOrdinal(instance, providedFormat, state) {
  var ordinalFn = state.currentOrdinal();
  var options = Object.assign({}, defaultOptions, providedFormat);
  var output = formatNumber({
    instance: instance,
    providedFormat: providedFormat,
    state: state
  });
  var ordinal = ordinalFn(instance._value);
  return "".concat(output).concat(options.spaceSeparated ? " " : "").concat(ordinal);
}
/**
 * Format the provided INSTANCE as a time HH:MM:SS.
 *
 * @param {Numbro} instance - numbro instance to format
 * @return {string}
 */


function formatTime(instance) {
  var hours = Math.floor(instance._value / 60 / 60);
  var minutes = Math.floor((instance._value - hours * 60 * 60) / 60);
  var seconds = Math.round(instance._value - hours * 60 * 60 - minutes * 60);
  return "".concat(hours, ":").concat(minutes < 10 ? "0" : "").concat(minutes, ":").concat(seconds < 10 ? "0" : "").concat(seconds);
}
/**
 * Format the provided INSTANCE as a percentage using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param numbro - the numbro singleton
 * @return {string}
 */


function formatPercentage(instance, providedFormat, state, numbro) {
  var prefixSymbol = providedFormat.prefixSymbol;
  var output = formatNumber({
    instance: numbro(instance._value * 100),
    providedFormat: providedFormat,
    state: state
  });
  var options = Object.assign({}, defaultOptions, providedFormat);

  if (prefixSymbol) {
    if (instance._value < 0 && options.negative === "parenthesis") {
      return "(%".concat(options.spaceSeparated ? " " : "").concat(output.slice(1));
    } else {
      return "%".concat(options.spaceSeparated ? " " : "").concat(output);
    }
  }

  if (instance._value < 0 && options.negative === "parenthesis") {
    return "".concat(output.slice(0, -1)).concat(options.spaceSeparated ? " " : "", "%)");
  } else {
    return "".concat(output).concat(options.spaceSeparated ? " " : "", "%");
  }
}
/**
 * Format the provided INSTANCE as a percentage using the PROVIDEDFORMAT,
 * and the STATE.
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} providedFormat - specification for formatting
 * @param {globalState} state - shared state of the library
 * @return {string}
 */


function formatCurrency(instance, providedFormat, state) {
  var currentCurrency = state.currentCurrency();
  var clonedFormat = Object.assign({}, providedFormat);
  var options = Object.assign({}, defaultOptions, clonedFormat);
  var decimalSeparator = undefined;
  var space = "";
  var average = !!options.totalLength || !!options.forceAverage || options.average;
  var position = clonedFormat.currencyPosition || currentCurrency.position;
  var symbol = clonedFormat.currencySymbol || currentCurrency.symbol;
  var spaceSeparatedCurrency = options.spaceSeparatedCurrency !== void 0 ? options.spaceSeparatedCurrency : options.spaceSeparated;

  if (clonedFormat.lowPrecision === undefined) {
    clonedFormat.lowPrecision = false;
  }

  if (spaceSeparatedCurrency) {
    space = " ";
  }

  if (position === "infix") {
    decimalSeparator = space + symbol + space;
  }

  var output = formatNumber({
    instance: instance,
    providedFormat: clonedFormat,
    state: state,
    decimalSeparator: decimalSeparator
  });

  if (position === "prefix") {
    if (instance._value < 0 && options.negative === "sign") {
      output = "-".concat(space).concat(symbol).concat(output.slice(1));
    } else if (instance._value < 0 && options.negative === "parenthesis") {
      output = "(".concat(symbol).concat(space).concat(output.slice(1));
    } else if (instance._value > 0 && options.forceSign) {
      output = "+".concat(space).concat(symbol).concat(output.slice(1));
    } else {
      output = symbol + space + output;
    }
  }

  if (!position || position === "postfix") {
    if (instance._value < 0 && options.negative === "parenthesis") {
      output = "".concat(output.slice(0, -1)).concat(space).concat(symbol, ")");
    } else {
      space = !options.spaceSeparatedAbbreviation && average ? "" : space;
      output = output + space + symbol;
    }
  }

  return output;
}
/**
 * Compute the average value out of VALUE.
 * The other parameters are computation options.
 *
 * @param {number} value - value to compute
 * @param {string} [forceAverage] - forced unit used to compute
 * @param {boolean} [lowPrecision=true] - reduce average precision
 * @param {{}} abbreviations - part of the language specification
 * @param {boolean} spaceSeparated - `true` if a space must be inserted between the value and the abbreviation
 * @param {number} [totalLength] - total length of the output including the characteristic and the mantissa
 * @param {function} roundingFunction - function used to round numbers
 * @return {{value: number, abbreviation: string, mantissaPrecision: number}}
 */


function computeAverage(_ref) {
  var value = _ref.value,
      forceAverage = _ref.forceAverage,
      _ref$lowPrecision = _ref.lowPrecision,
      lowPrecision = _ref$lowPrecision === void 0 ? true : _ref$lowPrecision,
      abbreviations = _ref.abbreviations,
      _ref$spaceSeparated = _ref.spaceSeparated,
      spaceSeparated = _ref$spaceSeparated === void 0 ? false : _ref$spaceSeparated,
      _ref$totalLength = _ref.totalLength,
      totalLength = _ref$totalLength === void 0 ? 0 : _ref$totalLength,
      _ref$roundingFunction = _ref.roundingFunction,
      roundingFunction = _ref$roundingFunction === void 0 ? Math.round : _ref$roundingFunction;
  var abbreviation = "";
  var abs = Math.abs(value);
  var mantissaPrecision = -1;

  if (forceAverage && abbreviations[forceAverage] && powers[forceAverage]) {
    abbreviation = abbreviations[forceAverage];
    value = value / powers[forceAverage];
  } else {
    if (abs >= powers.trillion || lowPrecision && roundingFunction(abs / powers.trillion) === 1) {
      // trillion
      abbreviation = abbreviations.trillion;
      value = value / powers.trillion;
    } else if (abs < powers.trillion && abs >= powers.billion || lowPrecision && roundingFunction(abs / powers.billion) === 1) {
      // billion
      abbreviation = abbreviations.billion;
      value = value / powers.billion;
    } else if (abs < powers.billion && abs >= powers.million || lowPrecision && roundingFunction(abs / powers.million) === 1) {
      // million
      abbreviation = abbreviations.million;
      value = value / powers.million;
    } else if (abs < powers.million && abs >= powers.thousand || lowPrecision && roundingFunction(abs / powers.thousand) === 1) {
      // thousand
      abbreviation = abbreviations.thousand;
      value = value / powers.thousand;
    }
  }

  var optionalSpace = spaceSeparated ? " " : "";

  if (abbreviation) {
    abbreviation = optionalSpace + abbreviation;
  }

  if (totalLength) {
    var isNegative = value < 0;
    var characteristic = value.toString().split(".")[0];
    var characteristicLength = isNegative ? characteristic.length - 1 : characteristic.length;
    mantissaPrecision = Math.max(totalLength - characteristicLength, 0);
  }

  return {
    value: value,
    abbreviation: abbreviation,
    mantissaPrecision: mantissaPrecision
  };
}
/**
 * Compute an exponential form for VALUE, taking into account CHARACTERISTIC
 * if provided.
 * @param {number} value - value to compute
 * @param {number} [characteristicPrecision] - optional characteristic length
 * @return {{value: number, abbreviation: string}}
 */


function computeExponential(_ref2) {
  var value = _ref2.value,
      _ref2$characteristicP = _ref2.characteristicPrecision,
      characteristicPrecision = _ref2$characteristicP === void 0 ? 0 : _ref2$characteristicP;

  var _value$toExponential$ = value.toExponential().split("e"),
      _value$toExponential$2 = _slicedToArray(_value$toExponential$, 2),
      numberString = _value$toExponential$2[0],
      exponential = _value$toExponential$2[1];

  var number = +numberString;

  if (!characteristicPrecision) {
    return {
      value: number,
      abbreviation: "e".concat(exponential)
    };
  }

  var characteristicLength = 1; // see `toExponential`

  if (characteristicLength < characteristicPrecision) {
    number = number * Math.pow(10, characteristicPrecision - characteristicLength);
    exponential = +exponential - (characteristicPrecision - characteristicLength);
    exponential = exponential >= 0 ? "+".concat(exponential) : exponential;
  }

  return {
    value: number,
    abbreviation: "e".concat(exponential)
  };
}
/**
 * Return a string of NUMBER zero.
 *
 * @param {number} number - Length of the output
 * @return {string}
 */


function zeroes(number) {
  var result = "";

  for (var i = 0; i < number; i++) {
    result += "0";
  }

  return result;
}
/**
 * Return a string representing VALUE with a PRECISION-long mantissa.
 * This method is for large/small numbers only (a.k.a. including a "e").
 *
 * @param {number} value - number to precise
 * @param {number} precision - desired length for the mantissa
 * @return {string}
 */


function toFixedLarge(value, precision) {
  var result = value.toString();

  var _result$split = result.split("e"),
      _result$split2 = _slicedToArray(_result$split, 2),
      base = _result$split2[0],
      exp = _result$split2[1];

  var _base$split = base.split("."),
      _base$split2 = _slicedToArray(_base$split, 2),
      characteristic = _base$split2[0],
      _base$split2$ = _base$split2[1],
      mantissa = _base$split2$ === void 0 ? "" : _base$split2$;

  if (+exp > 0) {
    result = characteristic + mantissa + zeroes(exp - mantissa.length);
  } else {
    var prefix = ".";

    if (+characteristic < 0) {
      prefix = "-0".concat(prefix);
    } else {
      prefix = "0".concat(prefix);
    }

    var suffix = (zeroes(-exp - 1) + Math.abs(characteristic) + mantissa).substr(0, precision);

    if (suffix.length < precision) {
      suffix += zeroes(precision - suffix.length);
    }

    result = prefix + suffix;
  }

  if (+exp > 0 && precision > 0) {
    result += ".".concat(zeroes(precision));
  }

  return result;
}
/**
 * Return a string representing VALUE with a PRECISION-long mantissa.
 *
 * @param {number} value - number to precise
 * @param {number} precision - desired length for the mantissa
 * @param {function} roundingFunction - rounding function to be used
 * @return {string}
 */


function toFixed(value, precision) {
  var roundingFunction = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : Math.round;

  if (value.toString().indexOf("e") !== -1) {
    return toFixedLarge(value, precision);
  }

  return (roundingFunction(+"".concat(value, "e+").concat(precision)) / Math.pow(10, precision)).toFixed(precision);
}
/**
 * Return the current OUTPUT with a mantissa precision of PRECISION.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} optionalMantissa - if `true`, the mantissa is omitted when it's only zeroes
 * @param {number} precision - desired precision of the mantissa
 * @param {boolean} trim - if `true`, trailing zeroes are removed from the mantissa
 * @return {string}
 */


function setMantissaPrecision(output, value, optionalMantissa, precision, trim, roundingFunction) {
  if (precision === -1) {
    return output;
  }

  var result = toFixed(value, precision, roundingFunction);

  var _result$toString$spli = result.toString().split("."),
      _result$toString$spli2 = _slicedToArray(_result$toString$spli, 2),
      currentCharacteristic = _result$toString$spli2[0],
      _result$toString$spli3 = _result$toString$spli2[1],
      currentMantissa = _result$toString$spli3 === void 0 ? "" : _result$toString$spli3;

  if (currentMantissa.match(/^0+$/) && (optionalMantissa || trim)) {
    return currentCharacteristic;
  }

  var hasTrailingZeroes = currentMantissa.match(/0+$/);

  if (trim && hasTrailingZeroes) {
    return "".concat(currentCharacteristic, ".").concat(currentMantissa.toString().slice(0, hasTrailingZeroes.index));
  }

  return result.toString();
}
/**
 * Return the current OUTPUT with a characteristic precision of PRECISION.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} optionalCharacteristic - `true` if the characteristic is omitted when it's only zeroes
 * @param {number} precision - desired precision of the characteristic
 * @return {string}
 */


function setCharacteristicPrecision(output, value, optionalCharacteristic, precision) {
  var result = output;

  var _result$toString$spli4 = result.toString().split("."),
      _result$toString$spli5 = _slicedToArray(_result$toString$spli4, 2),
      currentCharacteristic = _result$toString$spli5[0],
      currentMantissa = _result$toString$spli5[1];

  if (currentCharacteristic.match(/^-?0$/) && optionalCharacteristic) {
    if (!currentMantissa) {
      return currentCharacteristic.replace("0", "");
    }

    return "".concat(currentCharacteristic.replace("0", ""), ".").concat(currentMantissa);
  }

  var hasNegativeSign = value < 0 && currentCharacteristic.indexOf("-") === 0;

  if (hasNegativeSign) {
    // Remove the negative sign
    currentCharacteristic = currentCharacteristic.slice(1);
    result = result.slice(1);
  }

  if (currentCharacteristic.length < precision) {
    var missingZeros = precision - currentCharacteristic.length;

    for (var i = 0; i < missingZeros; i++) {
      result = "0".concat(result);
    }
  }

  if (hasNegativeSign) {
    // Add back the minus sign
    result = "-".concat(result);
  }

  return result.toString();
}
/**
 * Return the indexes where are the group separations after splitting
 * `totalLength` in group of `groupSize` size.
 * Important: we start grouping from the right hand side.
 *
 * @param {number} totalLength - total length of the characteristic to split
 * @param {number} groupSize - length of each group
 * @return {[number]}
 */


function indexesOfGroupSpaces(totalLength, groupSize) {
  var result = [];
  var counter = 0;

  for (var i = totalLength; i > 0; i--) {
    if (counter === groupSize) {
      result.unshift(i);
      counter = 0;
    }

    counter++;
  }

  return result;
}
/**
 * Replace the decimal separator with DECIMALSEPARATOR and insert thousand
 * separators.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {boolean} thousandSeparated - `true` if the characteristic must be separated
 * @param {globalState} state - shared state of the library
 * @param {string} decimalSeparator - string to use as decimal separator
 * @return {string}
 */


function replaceDelimiters(output, value, thousandSeparated, state, decimalSeparator) {
  var delimiters = state.currentDelimiters();
  var thousandSeparator = delimiters.thousands;
  decimalSeparator = decimalSeparator || delimiters.decimal;
  var thousandsSize = delimiters.thousandsSize || 3;
  var result = output.toString();
  var characteristic = result.split(".")[0];
  var mantissa = result.split(".")[1];
  var hasNegativeSign = value < 0 && characteristic.indexOf("-") === 0;

  if (thousandSeparated) {
    if (hasNegativeSign) {
      // Remove the negative sign
      characteristic = characteristic.slice(1);
    }

    var indexesToInsertThousandDelimiters = indexesOfGroupSpaces(characteristic.length, thousandsSize);
    indexesToInsertThousandDelimiters.forEach(function (position, index) {
      characteristic = characteristic.slice(0, position + index) + thousandSeparator + characteristic.slice(position + index);
    });

    if (hasNegativeSign) {
      // Add back the negative sign
      characteristic = "-".concat(characteristic);
    }
  }

  if (!mantissa) {
    result = characteristic;
  } else {
    result = characteristic + decimalSeparator + mantissa;
  }

  return result;
}
/**
 * Insert the provided ABBREVIATION at the end of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} abbreviation - abbreviation to append
 * @return {*}
 */


function insertAbbreviation(output, abbreviation) {
  return output + abbreviation;
}
/**
 * Insert the positive/negative sign according to the NEGATIVE flag.
 * If the value is negative but still output as 0, the negative sign is removed.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {number} value - number being currently formatted
 * @param {string} negative - flag for the negative form ("sign" or "parenthesis")
 * @return {*}
 */


function insertSign(output, value, negative) {
  if (value === 0) {
    return output;
  }

  if (+output === 0) {
    return output.replace("-", "");
  }

  if (value > 0) {
    return "+".concat(output);
  }

  if (negative === "sign") {
    return output;
  }

  return "(".concat(output.replace("-", ""), ")");
}
/**
 * Insert the provided PREFIX at the start of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} prefix - abbreviation to prepend
 * @return {*}
 */


function insertPrefix(output, prefix) {
  return prefix + output;
}
/**
 * Insert the provided POSTFIX at the end of OUTPUT.
 *
 * @param {string} output - output being build in the process of formatting
 * @param {string} postfix - abbreviation to append
 * @return {*}
 */


function insertPostfix(output, postfix) {
  return output + postfix;
}
/**
 * Format the provided INSTANCE as a number using the PROVIDEDFORMAT,
 * and the STATE.
 * This is the key method of the framework!
 *
 * @param {Numbro} instance - numbro instance to format
 * @param {{}} [providedFormat] - specification for formatting
 * @param {globalState} state - shared state of the library
 * @param {string} decimalSeparator - string to use as decimal separator
 * @param {{}} defaults - Set of default values used for formatting
 * @return {string}
 */


function formatNumber(_ref3) {
  var instance = _ref3.instance,
      providedFormat = _ref3.providedFormat,
      _ref3$state = _ref3.state,
      state = _ref3$state === void 0 ? globalState : _ref3$state,
      decimalSeparator = _ref3.decimalSeparator,
      _ref3$defaults = _ref3.defaults,
      defaults = _ref3$defaults === void 0 ? state.currentDefaults() : _ref3$defaults;
  var value = instance._value;

  if (value === 0 && state.hasZeroFormat()) {
    return state.getZeroFormat();
  }

  if (!isFinite(value)) {
    return value.toString();
  }

  var options = Object.assign({}, defaultOptions, defaults, providedFormat);
  var totalLength = options.totalLength;
  var characteristicPrecision = totalLength ? 0 : options.characteristic;
  var optionalCharacteristic = options.optionalCharacteristic;
  var forceAverage = options.forceAverage;
  var lowPrecision = options.lowPrecision;
  var average = !!totalLength || !!forceAverage || options.average; // default when averaging is to chop off decimals

  var mantissaPrecision = totalLength ? -1 : average && providedFormat.mantissa === undefined ? 0 : options.mantissa;
  var optionalMantissa = totalLength ? false : providedFormat.optionalMantissa === undefined ? mantissaPrecision === -1 : options.optionalMantissa;
  var trimMantissa = options.trimMantissa;
  var thousandSeparated = options.thousandSeparated;
  var spaceSeparated = options.spaceSeparated;
  var negative = options.negative;
  var forceSign = options.forceSign;
  var exponential = options.exponential;
  var roundingFunction = options.roundingFunction;
  var abbreviation = "";

  if (average) {
    var data = computeAverage({
      value: value,
      forceAverage: forceAverage,
      lowPrecision: lowPrecision,
      abbreviations: state.currentAbbreviations(),
      spaceSeparated: spaceSeparated,
      roundingFunction: roundingFunction,
      totalLength: totalLength
    });
    value = data.value;
    abbreviation += data.abbreviation;

    if (totalLength) {
      mantissaPrecision = data.mantissaPrecision;
    }
  }

  if (exponential) {
    var _data = computeExponential({
      value: value,
      characteristicPrecision: characteristicPrecision
    });

    value = _data.value;
    abbreviation = _data.abbreviation + abbreviation;
  }

  var output = setMantissaPrecision(value.toString(), value, optionalMantissa, mantissaPrecision, trimMantissa, roundingFunction);
  output = setCharacteristicPrecision(output, value, optionalCharacteristic, characteristicPrecision);
  output = replaceDelimiters(output, value, thousandSeparated, state, decimalSeparator);

  if (average || exponential) {
    output = insertAbbreviation(output, abbreviation);
  }

  if (forceSign || value < 0) {
    output = insertSign(output, value, negative);
  }

  return output;
}
/**
 * If FORMAT is non-null and not just an output, return FORMAT.
 * Return DEFAULTFORMAT otherwise.
 *
 * @param providedFormat
 * @param defaultFormat
 */


function formatOrDefault(providedFormat, defaultFormat) {
  if (!providedFormat) {
    return defaultFormat;
  }

  var keys = Object.keys(providedFormat);

  if (keys.length === 1 && keys[0] === "output") {
    return defaultFormat;
  }

  return providedFormat;
}

module.exports = function (numbro) {
  return {
    format: function format() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _format.apply(void 0, args.concat([numbro]));
    },
    getByteUnit: function getByteUnit() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return _getByteUnit.apply(void 0, args.concat([numbro]));
    },
    getBinaryByteUnit: function getBinaryByteUnit() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return _getBinaryByteUnit.apply(void 0, args.concat([numbro]));
    },
    getDecimalByteUnit: function getDecimalByteUnit() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return _getDecimalByteUnit.apply(void 0, args.concat([numbro]));
    },
    formatOrDefault: formatOrDefault
  };
};

},{"./globalState":4,"./parsing":8,"./validating":10}],4:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var enUS = require("./en-US");

var validating = require("./validating");

var parsing = require("./parsing");

var state = {};
var currentLanguageTag = undefined;
var languages = {};
var zeroFormat = null;
var globalDefaults = {};

function chooseLanguage(tag) {
  currentLanguageTag = tag;
}

function currentLanguageData() {
  return languages[currentLanguageTag];
}
/**
 * Return all the register languages
 *
 * @return {{}}
 */


state.languages = function () {
  return Object.assign({}, languages);
}; //
// Current language accessors
//

/**
 * Return the current language tag
 *
 * @return {string}
 */


state.currentLanguage = function () {
  return currentLanguageTag;
};
/**
 * Return the current language bytes data
 *
 * @return {{}}
 */


state.currentBytes = function () {
  return currentLanguageData().bytes || {};
};
/**
 * Return the current language currency data
 *
 * @return {{}}
 */


state.currentCurrency = function () {
  return currentLanguageData().currency;
};
/**
 * Return the current language abbreviations data
 *
 * @return {{}}
 */


state.currentAbbreviations = function () {
  return currentLanguageData().abbreviations;
};
/**
 * Return the current language delimiters data
 *
 * @return {{}}
 */


state.currentDelimiters = function () {
  return currentLanguageData().delimiters;
};
/**
 * Return the current language ordinal function
 *
 * @return {function}
 */


state.currentOrdinal = function () {
  return currentLanguageData().ordinal;
}; //
// Defaults
//

/**
 * Return the current formatting defaults.
 * First use the current language default, then fallback to the globally defined defaults.
 *
 * @return {{}}
 */


state.currentDefaults = function () {
  return Object.assign({}, currentLanguageData().defaults, globalDefaults);
};
/**
 * Return the ordinal default-format.
 * First use the current language ordinal default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentOrdinalDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().ordinalFormat);
};
/**
 * Return the byte default-format.
 * First use the current language byte default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentByteDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().byteFormat);
};
/**
 * Return the percentage default-format.
 * First use the current language percentage default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentPercentageDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().percentageFormat);
};
/**
 * Return the currency default-format.
 * First use the current language currency default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentCurrencyDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().currencyFormat);
};
/**
 * Return the time default-format.
 * First use the current language currency default, then fallback to the regular defaults.
 *
 * @return {{}}
 */


state.currentTimeDefaultFormat = function () {
  return Object.assign({}, state.currentDefaults(), currentLanguageData().timeFormat);
};
/**
 * Set the global formatting defaults.
 *
 * @param {{}|string} format - formatting options to use as defaults
 */


state.setDefaults = function (format) {
  format = parsing.parseFormat(format);

  if (validating.validateFormat(format)) {
    globalDefaults = format;
  }
}; //
// Zero format
//

/**
 * Return the format string for 0.
 *
 * @return {string}
 */


state.getZeroFormat = function () {
  return zeroFormat;
};
/**
 * Set a STRING to output when the value is 0.
 *
 * @param {{}|string} string - string to set
 */


state.setZeroFormat = function (string) {
  return zeroFormat = typeof string === "string" ? string : null;
};
/**
 * Return true if a format for 0 has been set already.
 *
 * @return {boolean}
 */


state.hasZeroFormat = function () {
  return zeroFormat !== null;
}; //
// Getters/Setters
//

/**
 * Return the language data for the provided TAG.
 * Return the current language data if no tag is provided.
 *
 * Throw an error if the tag doesn't match any registered language.
 *
 * @param {string} [tag] - language tag of a registered language
 * @return {{}}
 */


state.languageData = function (tag) {
  if (tag) {
    if (languages[tag]) {
      return languages[tag];
    }

    throw new Error("Unknown tag \"".concat(tag, "\""));
  }

  return currentLanguageData();
};
/**
 * Register the provided DATA as a language if and only if the data is valid.
 * If the data is not valid, an error is thrown.
 *
 * When USELANGUAGE is true, the registered language is then used.
 *
 * @param {{}} data - language data to register
 * @param {boolean} [useLanguage] - `true` if the provided data should become the current language
 */


state.registerLanguage = function (data) {
  var useLanguage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!validating.validateLanguage(data)) {
    throw new Error("Invalid language data");
  }

  languages[data.languageTag] = data;

  if (useLanguage) {
    chooseLanguage(data.languageTag);
  }
};
/**
 * Set the current language according to TAG.
 * If TAG doesn't match a registered language, another language matching
 * the "language" part of the tag (according to BCP47: https://tools.ietf.org/rfc/bcp/bcp47.txt).
 * If none, the FALLBACKTAG is used. If the FALLBACKTAG doesn't match a register language,
 * `en-US` is finally used.
 *
 * @param tag
 * @param fallbackTag
 */


state.setLanguage = function (tag) {
  var fallbackTag = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : enUS.languageTag;

  if (!languages[tag]) {
    var suffix = tag.split("-")[0];
    var matchingLanguageTag = Object.keys(languages).find(function (each) {
      return each.split("-")[0] === suffix;
    });

    if (!languages[matchingLanguageTag]) {
      chooseLanguage(fallbackTag);
      return;
    }

    chooseLanguage(matchingLanguageTag);
    return;
  }

  chooseLanguage(tag);
};

state.registerLanguage(enUS);
currentLanguageTag = enUS.languageTag;
module.exports = state;

},{"./en-US":2,"./parsing":8,"./validating":10}],5:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Load languages matching TAGS. Silently pass over the failing load.
 *
 * We assume here that we are in a node environment, so we don't check for it.
 * @param {[String]} tags - list of tags to load
 * @param {Numbro} numbro - the numbro singleton
 */
function _loadLanguagesInNode(tags, numbro) {
  tags.forEach(function (tag) {
    var data = undefined;

    try {
      data = require("../languages/".concat(tag));
    } catch (e) {
      console.error("Unable to load \"".concat(tag, "\". No matching language file found.")); // eslint-disable-line no-console
    }

    if (data) {
      numbro.registerLanguage(data);
    }
  });
}

module.exports = function (numbro) {
  return {
    loadLanguagesInNode: function loadLanguagesInNode(tags) {
      return _loadLanguagesInNode(tags, numbro);
    }
  };
};

},{}],6:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var BigNumber = require("bignumber.js");
/**
 * Add a number or a numbro to N.
 *
 * @param {Numbro} n - augend
 * @param {number|Numbro} other - addend
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _add(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.plus(otherValue).toNumber();
  return n;
}
/**
 * Subtract a number or a numbro from N.
 *
 * @param {Numbro} n - minuend
 * @param {number|Numbro} other - subtrahend
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _subtract(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.minus(otherValue).toNumber();
  return n;
}
/**
 * Multiply N by a number or a numbro.
 *
 * @param {Numbro} n - multiplicand
 * @param {number|Numbro} other - multiplier
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _multiply(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.times(otherValue).toNumber();
  return n;
}
/**
 * Divide N by a number or a numbro.
 *
 * @param {Numbro} n - dividend
 * @param {number|Numbro} other - divisor
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _divide(n, other, numbro) {
  var value = new BigNumber(n._value);
  var otherValue = other;

  if (numbro.isNumbro(other)) {
    otherValue = other._value;
  }

  otherValue = new BigNumber(otherValue);
  n._value = value.dividedBy(otherValue).toNumber();
  return n;
}
/**
 * Set N to the OTHER (or the value of OTHER when it's a numbro instance).
 *
 * @param {Numbro} n - numbro instance to mutate
 * @param {number|Numbro} other - new value to assign to N
 * @param {numbro} numbro - numbro singleton
 * @return {Numbro} n
 */


function _set(n, other, numbro) {
  var value = other;

  if (numbro.isNumbro(other)) {
    value = other._value;
  }

  n._value = value;
  return n;
}
/**
 * Return the distance between N and OTHER.
 *
 * @param {Numbro} n
 * @param {number|Numbro} other
 * @param {numbro} numbro - numbro singleton
 * @return {number}
 */


function _difference(n, other, numbro) {
  var clone = numbro(n._value);

  _subtract(clone, other, numbro);

  return Math.abs(clone._value);
}

module.exports = function (numbro) {
  return {
    add: function add(n, other) {
      return _add(n, other, numbro);
    },
    subtract: function subtract(n, other) {
      return _subtract(n, other, numbro);
    },
    multiply: function multiply(n, other) {
      return _multiply(n, other, numbro);
    },
    divide: function divide(n, other) {
      return _divide(n, other, numbro);
    },
    set: function set(n, other) {
      return _set(n, other, numbro);
    },
    difference: function difference(n, other) {
      return _difference(n, other, numbro);
    },
    BigNumber: BigNumber
  };
};

},{"bignumber.js":1}],7:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var VERSION = "2.3.5";

var globalState = require("./globalState");

var validator = require("./validating");

var loader = require("./loading")(numbro);

var unformatter = require("./unformatting");

var formatter = require("./formatting")(numbro);

var manipulate = require("./manipulating")(numbro);

var parsing = require("./parsing");

var Numbro = /*#__PURE__*/function () {
  function Numbro(number) {
    _classCallCheck(this, Numbro);

    this._value = number;
  }

  _createClass(Numbro, [{
    key: "clone",
    value: function clone() {
      return numbro(this._value);
    }
  }, {
    key: "format",
    value: function format() {
      var _format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return formatter.format(this, _format);
    }
  }, {
    key: "formatCurrency",
    value: function formatCurrency(format) {
      if (typeof format === "string") {
        format = parsing.parseFormat(format);
      }

      format = formatter.formatOrDefault(format, globalState.currentCurrencyDefaultFormat());
      format.output = "currency";
      return formatter.format(this, format);
    }
  }, {
    key: "formatTime",
    value: function formatTime() {
      var format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      format.output = "time";
      return formatter.format(this, format);
    }
  }, {
    key: "binaryByteUnits",
    value: function binaryByteUnits() {
      return formatter.getBinaryByteUnit(this);
    }
  }, {
    key: "decimalByteUnits",
    value: function decimalByteUnits() {
      return formatter.getDecimalByteUnit(this);
    }
  }, {
    key: "byteUnits",
    value: function byteUnits() {
      return formatter.getByteUnit(this);
    }
  }, {
    key: "difference",
    value: function difference(other) {
      return manipulate.difference(this, other);
    }
  }, {
    key: "add",
    value: function add(other) {
      return manipulate.add(this, other);
    }
  }, {
    key: "subtract",
    value: function subtract(other) {
      return manipulate.subtract(this, other);
    }
  }, {
    key: "multiply",
    value: function multiply(other) {
      return manipulate.multiply(this, other);
    }
  }, {
    key: "divide",
    value: function divide(other) {
      return manipulate.divide(this, other);
    }
  }, {
    key: "set",
    value: function set(input) {
      return manipulate.set(this, normalizeInput(input));
    }
  }, {
    key: "value",
    value: function value() {
      return this._value;
    }
  }, {
    key: "valueOf",
    value: function valueOf() {
      return this._value;
    }
  }]);

  return Numbro;
}();
/**
 * Make its best to convert input into a number.
 *
 * @param {numbro|string|number} input - Input to convert
 * @return {number}
 */


function normalizeInput(input) {
  var result = input;

  if (numbro.isNumbro(input)) {
    result = input._value;
  } else if (typeof input === "string") {
    result = numbro.unformat(input);
  } else if (isNaN(input)) {
    result = NaN;
  }

  return result;
}

function numbro(input) {
  return new Numbro(normalizeInput(input));
}

numbro.version = VERSION;

numbro.isNumbro = function (object) {
  return object instanceof Numbro;
}; //
// `numbro` static methods
//


numbro.language = globalState.currentLanguage;
numbro.registerLanguage = globalState.registerLanguage;
numbro.setLanguage = globalState.setLanguage;
numbro.languages = globalState.languages;
numbro.languageData = globalState.languageData;
numbro.zeroFormat = globalState.setZeroFormat;
numbro.defaultFormat = globalState.currentDefaults;
numbro.setDefaults = globalState.setDefaults;
numbro.defaultCurrencyFormat = globalState.currentCurrencyDefaultFormat;
numbro.validate = validator.validate;
numbro.loadLanguagesInNode = loader.loadLanguagesInNode;
numbro.unformat = unformatter.unformat;
numbro.BigNumber = manipulate.BigNumber;
module.exports = numbro;

},{"./formatting":3,"./globalState":4,"./loading":5,"./manipulating":6,"./parsing":8,"./unformatting":9,"./validating":10}],8:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Parse the format STRING looking for a prefix. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */
function parsePrefix(string, result) {
  var match = string.match(/^{([^}]*)}/);

  if (match) {
    result.prefix = match[1];
    return string.slice(match[0].length);
  }

  return string;
}
/**
 * Parse the format STRING looking for a postfix. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parsePostfix(string, result) {
  var match = string.match(/{([^}]*)}$/);

  if (match) {
    result.postfix = match[1];
    return string.slice(0, -match[0].length);
  }

  return string;
}
/**
 * Parse the format STRING looking for the output value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 */


function parseOutput(string, result) {
  if (string.indexOf("$") !== -1) {
    result.output = "currency";
    return;
  }

  if (string.indexOf("%") !== -1) {
    result.output = "percent";
    return;
  }

  if (string.indexOf("bd") !== -1) {
    result.output = "byte";
    result.base = "general";
    return;
  }

  if (string.indexOf("b") !== -1) {
    result.output = "byte";
    result.base = "binary";
    return;
  }

  if (string.indexOf("d") !== -1) {
    result.output = "byte";
    result.base = "decimal";
    return;
  }

  if (string.indexOf(":") !== -1) {
    result.output = "time";
    return;
  }

  if (string.indexOf("o") !== -1) {
    result.output = "ordinal";
  }
}
/**
 * Parse the format STRING looking for the thousand separated value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseThousandSeparated(string, result) {
  if (string.indexOf(",") !== -1) {
    result.thousandSeparated = true;
  }
}
/**
 * Parse the format STRING looking for the space separated value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseSpaceSeparated(string, result) {
  if (string.indexOf(" ") !== -1) {
    result.spaceSeparated = true;
    result.spaceSeparatedCurrency = true;

    if (result.average || result.forceAverage) {
      result.spaceSeparatedAbbreviation = true;
    }
  }
}
/**
 * Parse the format STRING looking for the total length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseTotalLength(string, result) {
  var match = string.match(/[1-9]+[0-9]*/);

  if (match) {
    result.totalLength = +match[0];
  }
}
/**
 * Parse the format STRING looking for the characteristic length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseCharacteristic(string, result) {
  var characteristic = string.split(".")[0];
  var match = characteristic.match(/0+/);

  if (match) {
    result.characteristic = match[0].length;
  }
}
/**
 * Parse the format STRING looking for the mantissa length. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseMantissa(string, result) {
  var mantissa = string.split(".")[1];

  if (mantissa) {
    var match = mantissa.match(/0+/);

    if (match) {
      result.mantissa = match[0].length;
    }
  }
}
/**
 * Parse the format STRING looking for a trimmed mantissa. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 */


function parseTrimMantissa(string, result) {
  var mantissa = string.split(".")[1];

  if (mantissa) {
    result.trimMantissa = mantissa.indexOf("[") !== -1;
  }
}
/**
 * Parse the format STRING looking for the average value. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseAverage(string, result) {
  if (string.indexOf("a") !== -1) {
    result.average = true;
  }
}
/**
 * Parse the format STRING looking for a forced average precision. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseForceAverage(string, result) {
  if (string.indexOf("K") !== -1) {
    result.forceAverage = "thousand";
  } else if (string.indexOf("M") !== -1) {
    result.forceAverage = "million";
  } else if (string.indexOf("B") !== -1) {
    result.forceAverage = "billion";
  } else if (string.indexOf("T") !== -1) {
    result.forceAverage = "trillion";
  }
}
/**
 * Parse the format STRING finding if the mantissa is optional. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseOptionalMantissa(string, result) {
  if (string.match(/\[\.]/)) {
    result.optionalMantissa = true;
  } else if (string.match(/\./)) {
    result.optionalMantissa = false;
  }
}
/**
 * Parse the format STRING finding if the characteristic is optional. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseOptionalCharacteristic(string, result) {
  if (string.indexOf(".") !== -1) {
    var characteristic = string.split(".")[0];
    result.optionalCharacteristic = characteristic.indexOf("0") === -1;
  }
}
/**
 * Parse the format STRING looking for the negative format. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {string} - format
 */


function parseNegative(string, result) {
  if (string.match(/^\+?\([^)]*\)$/)) {
    result.negative = "parenthesis";
  }

  if (string.match(/^\+?-/)) {
    result.negative = "sign";
  }
}
/**
 * Parse the format STRING finding if the sign is mandatory. Append it to RESULT when found.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 */


function parseForceSign(string, result) {
  if (string.match(/^\+/)) {
    result.forceSign = true;
  }
}
/**
 * Parse the format STRING and accumulating the values ie RESULT.
 *
 * @param {string} string - format
 * @param {NumbroFormat} result - Result accumulator
 * @return {NumbroFormat} - format
 */


function parseFormat(string) {
  var result = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (typeof string !== "string") {
    return string;
  }

  string = parsePrefix(string, result);
  string = parsePostfix(string, result);
  parseOutput(string, result);
  parseTotalLength(string, result);
  parseCharacteristic(string, result);
  parseOptionalCharacteristic(string, result);
  parseAverage(string, result);
  parseForceAverage(string, result);
  parseMantissa(string, result);
  parseOptionalMantissa(string, result);
  parseTrimMantissa(string, result);
  parseThousandSeparated(string, result);
  parseSpaceSeparated(string, result);
  parseNegative(string, result);
  parseForceSign(string, result);
  return result;
}

module.exports = {
  parseFormat: parseFormat
};

},{}],9:[function(require,module,exports){
"use strict";

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var allSuffixes = [{
  key: "ZiB",
  factor: Math.pow(1024, 7)
}, {
  key: "ZB",
  factor: Math.pow(1000, 7)
}, {
  key: "YiB",
  factor: Math.pow(1024, 8)
}, {
  key: "YB",
  factor: Math.pow(1000, 8)
}, {
  key: "TiB",
  factor: Math.pow(1024, 4)
}, {
  key: "TB",
  factor: Math.pow(1000, 4)
}, {
  key: "PiB",
  factor: Math.pow(1024, 5)
}, {
  key: "PB",
  factor: Math.pow(1000, 5)
}, {
  key: "MiB",
  factor: Math.pow(1024, 2)
}, {
  key: "MB",
  factor: Math.pow(1000, 2)
}, {
  key: "KiB",
  factor: Math.pow(1024, 1)
}, {
  key: "KB",
  factor: Math.pow(1000, 1)
}, {
  key: "GiB",
  factor: Math.pow(1024, 3)
}, {
  key: "GB",
  factor: Math.pow(1000, 3)
}, {
  key: "EiB",
  factor: Math.pow(1024, 6)
}, {
  key: "EB",
  factor: Math.pow(1000, 6)
}, {
  key: "B",
  factor: 1
}];
/**
 * Generate a RegExp where S get all RegExp specific characters escaped.
 *
 * @param {string} s - string representing a RegExp
 * @return {string}
 */

function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}
/**
 * Recursively compute the unformatted value.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @param {function} ordinal - function used to generate an ordinal out of a number
 * @param {string} zeroFormat - string representing zero
 * @param {*} abbreviations - abbreviations used while generating the inputString
 * @param {NumbroFormat} format - format used while generating the inputString
 * @return {number|undefined}
 */


function computeUnformattedValue(inputString, delimiters) {
  var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  var ordinal = arguments.length > 3 ? arguments[3] : undefined;
  var zeroFormat = arguments.length > 4 ? arguments[4] : undefined;
  var abbreviations = arguments.length > 5 ? arguments[5] : undefined;
  var format = arguments.length > 6 ? arguments[6] : undefined;

  if (!isNaN(+inputString)) {
    return +inputString;
  }

  var stripped = ""; // Negative

  var newInput = inputString.replace(/(^[^(]*)\((.*)\)([^)]*$)/, "$1$2$3");

  if (newInput !== inputString) {
    return -1 * computeUnformattedValue(newInput, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
  } // Byte


  for (var i = 0; i < allSuffixes.length; i++) {
    var suffix = allSuffixes[i];
    stripped = inputString.replace(RegExp("([0-9 ])(".concat(suffix.key, ")$")), "$1");

    if (stripped !== inputString) {
      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) * suffix.factor;
    }
  } // Percent


  stripped = inputString.replace("%", "");

  if (stripped !== inputString) {
    return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) / 100;
  } // Ordinal


  var possibleOrdinalValue = parseFloat(inputString);

  if (isNaN(possibleOrdinalValue)) {
    return undefined;
  }

  var ordinalString = ordinal(possibleOrdinalValue);

  if (ordinalString && ordinalString !== ".") {
    // if ordinal is "." it will be caught next round in the +inputString
    stripped = inputString.replace(new RegExp("".concat(escapeRegExp(ordinalString), "$")), "");

    if (stripped !== inputString) {
      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
    }
  } // Average


  var inversedAbbreviations = {};
  Object.keys(abbreviations).forEach(function (key) {
    inversedAbbreviations[abbreviations[key]] = key;
  });
  var abbreviationValues = Object.keys(inversedAbbreviations).sort().reverse();
  var numberOfAbbreviations = abbreviationValues.length;

  for (var _i = 0; _i < numberOfAbbreviations; _i++) {
    var value = abbreviationValues[_i];
    var key = inversedAbbreviations[value];
    stripped = inputString.replace(value, "");

    if (stripped !== inputString) {
      var factor = undefined;

      switch (key) {
        // eslint-disable-line default-case
        case "thousand":
          factor = Math.pow(10, 3);
          break;

        case "million":
          factor = Math.pow(10, 6);
          break;

        case "billion":
          factor = Math.pow(10, 9);
          break;

        case "trillion":
          factor = Math.pow(10, 12);
          break;
      }

      return computeUnformattedValue(stripped, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format) * factor;
    }
  }

  return undefined;
}
/**
 * Removes in one pass all formatting symbols.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @return {string}
 */


function removeFormattingSymbols(inputString, delimiters) {
  var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  // Currency
  var stripped = inputString.replace(currencySymbol, ""); // Thousand separators

  stripped = stripped.replace(new RegExp("([0-9])".concat(escapeRegExp(delimiters.thousands), "([0-9])"), "g"), "$1$2"); // Decimal

  stripped = stripped.replace(delimiters.decimal, ".");
  return stripped;
}
/**
 * Unformat a numbro-generated string to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @param {*} delimiters - Delimiters used to generate the inputString
 * @param {string} [currencySymbol] - symbol used for currency while generating the inputString
 * @param {function} ordinal - function used to generate an ordinal out of a number
 * @param {string} zeroFormat - string representing zero
 * @param {*} abbreviations - abbreviations used while generating the inputString
 * @param {NumbroFormat} format - format used while generating the inputString
 * @return {number|undefined}
 */


function unformatValue(inputString, delimiters) {
  var currencySymbol = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";
  var ordinal = arguments.length > 3 ? arguments[3] : undefined;
  var zeroFormat = arguments.length > 4 ? arguments[4] : undefined;
  var abbreviations = arguments.length > 5 ? arguments[5] : undefined;
  var format = arguments.length > 6 ? arguments[6] : undefined;

  if (inputString === "") {
    return undefined;
  } // Zero Format


  if (inputString === zeroFormat) {
    return 0;
  }

  var value = removeFormattingSymbols(inputString, delimiters, currencySymbol);
  return computeUnformattedValue(value, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
}
/**
 * Check if the INPUTSTRING represents a time.
 *
 * @param {string} inputString - string to check
 * @param {*} delimiters - Delimiters used while generating the inputString
 * @return {boolean}
 */


function matchesTime(inputString, delimiters) {
  var separators = inputString.indexOf(":") && delimiters.thousands !== ":";

  if (!separators) {
    return false;
  }

  var segments = inputString.split(":");

  if (segments.length !== 3) {
    return false;
  }

  var hours = +segments[0];
  var minutes = +segments[1];
  var seconds = +segments[2];
  return !isNaN(hours) && !isNaN(minutes) && !isNaN(seconds);
}
/**
 * Unformat a numbro-generated string representing a time to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @return {number}
 */


function unformatTime(inputString) {
  var segments = inputString.split(":");
  var hours = +segments[0];
  var minutes = +segments[1];
  var seconds = +segments[2];
  return seconds + 60 * minutes + 3600 * hours;
}
/**
 * Unformat a numbro-generated string to retrieve the original value.
 *
 * @param {string} inputString - string to unformat
 * @param {NumbroFormat} format - format used  while generating the inputString
 * @return {number}
 */


function unformat(inputString, format) {
  // Avoid circular references
  var globalState = require("./globalState");

  var delimiters = globalState.currentDelimiters();
  var currencySymbol = globalState.currentCurrency().symbol;
  var ordinal = globalState.currentOrdinal();
  var zeroFormat = globalState.getZeroFormat();
  var abbreviations = globalState.currentAbbreviations();
  var value = undefined;

  if (typeof inputString === "string") {
    if (matchesTime(inputString, delimiters)) {
      value = unformatTime(inputString);
    } else {
      value = unformatValue(inputString, delimiters, currencySymbol, ordinal, zeroFormat, abbreviations, format);
    }
  } else if (typeof inputString === "number") {
    value = inputString;
  } else {
    return undefined;
  }

  if (value === undefined) {
    return undefined;
  }

  return value;
}

module.exports = {
  unformat: unformat
};

},{"./globalState":4}],10:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
 * Copyright (c) 2017 Benjamin Van Ryseghem<benjamin@vanryseghem.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var unformatter = require("./unformatting"); // Simplified regexp supporting only `language`, `script`, and `region`


var bcp47RegExp = /^[a-z]{2,3}(-[a-zA-Z]{4})?(-([A-Z]{2}|[0-9]{3}))?$/;
var validOutputValues = ["currency", "percent", "byte", "time", "ordinal", "number"];
var validForceAverageValues = ["trillion", "billion", "million", "thousand"];
var validCurrencyPosition = ["prefix", "infix", "postfix"];
var validNegativeValues = ["sign", "parenthesis"];
var validMandatoryAbbreviations = {
  type: "object",
  children: {
    thousand: {
      type: "string",
      mandatory: true
    },
    million: {
      type: "string",
      mandatory: true
    },
    billion: {
      type: "string",
      mandatory: true
    },
    trillion: {
      type: "string",
      mandatory: true
    }
  },
  mandatory: true
};
var validAbbreviations = {
  type: "object",
  children: {
    thousand: "string",
    million: "string",
    billion: "string",
    trillion: "string"
  }
};
var validBaseValues = ["decimal", "binary", "general"];
var validFormat = {
  output: {
    type: "string",
    validValues: validOutputValues
  },
  base: {
    type: "string",
    validValues: validBaseValues,
    restriction: function restriction(number, format) {
      return format.output === "byte";
    },
    message: "`base` must be provided only when the output is `byte`",
    mandatory: function mandatory(format) {
      return format.output === "byte";
    }
  },
  characteristic: {
    type: "number",
    restriction: function restriction(number) {
      return number >= 0;
    },
    message: "value must be positive"
  },
  prefix: "string",
  postfix: "string",
  forceAverage: {
    type: "string",
    validValues: validForceAverageValues
  },
  average: "boolean",
  lowPrecision: {
    type: "boolean",
    restriction: function restriction(number, format) {
      return format.average === true;
    },
    message: "`lowPrecision` must be provided only when the option `average` is set"
  },
  currencyPosition: {
    type: "string",
    validValues: validCurrencyPosition
  },
  currencySymbol: "string",
  totalLength: {
    type: "number",
    restrictions: [{
      restriction: function restriction(number) {
        return number >= 0;
      },
      message: "value must be positive"
    }, {
      restriction: function restriction(number, format) {
        return !format.exponential;
      },
      message: "`totalLength` is incompatible with `exponential`"
    }]
  },
  mantissa: {
    type: "number",
    restriction: function restriction(number) {
      return number >= 0;
    },
    message: "value must be positive"
  },
  optionalMantissa: "boolean",
  trimMantissa: "boolean",
  roundingFunction: "function",
  optionalCharacteristic: "boolean",
  thousandSeparated: "boolean",
  spaceSeparated: "boolean",
  spaceSeparatedCurrency: "boolean",
  spaceSeparatedAbbreviation: "boolean",
  abbreviations: validAbbreviations,
  negative: {
    type: "string",
    validValues: validNegativeValues
  },
  forceSign: "boolean",
  exponential: {
    type: "boolean"
  },
  prefixSymbol: {
    type: "boolean",
    restriction: function restriction(number, format) {
      return format.output === "percent";
    },
    message: "`prefixSymbol` can be provided only when the output is `percent`"
  }
};
var validLanguage = {
  languageTag: {
    type: "string",
    mandatory: true,
    restriction: function restriction(tag) {
      return tag.match(bcp47RegExp);
    },
    message: "the language tag must follow the BCP 47 specification (see https://tools.ieft.org/html/bcp47)"
  },
  delimiters: {
    type: "object",
    children: {
      thousands: "string",
      decimal: "string",
      thousandsSize: "number"
    },
    mandatory: true
  },
  abbreviations: validMandatoryAbbreviations,
  spaceSeparated: "boolean",
  spaceSeparatedCurrency: "boolean",
  ordinal: {
    type: "function",
    mandatory: true
  },
  bytes: {
    type: "object",
    children: {
      binarySuffixes: "object",
      decimalSuffixes: "object"
    }
  },
  currency: {
    type: "object",
    children: {
      symbol: "string",
      position: "string",
      code: "string"
    },
    mandatory: true
  },
  defaults: "format",
  ordinalFormat: "format",
  byteFormat: "format",
  percentageFormat: "format",
  currencyFormat: "format",
  timeDefaults: "format",
  formats: {
    type: "object",
    children: {
      fourDigits: {
        type: "format",
        mandatory: true
      },
      fullWithTwoDecimals: {
        type: "format",
        mandatory: true
      },
      fullWithTwoDecimalsNoCurrency: {
        type: "format",
        mandatory: true
      },
      fullWithNoDecimals: {
        type: "format",
        mandatory: true
      }
    }
  }
};
/**
 * Check the validity of the provided input and format.
 * The check is NOT lazy.
 *
 * @param {string|number|Numbro} input - input to check
 * @param {NumbroFormat} format - format to check
 * @return {boolean} True when everything is correct
 */

function validate(input, format) {
  var validInput = validateInput(input);
  var isFormatValid = validateFormat(format);
  return validInput && isFormatValid;
}
/**
 * Check the validity of the numbro input.
 *
 * @param {string|number|Numbro} input - input to check
 * @return {boolean} True when everything is correct
 */


function validateInput(input) {
  var value = unformatter.unformat(input);
  return value !== undefined;
}
/**
 * Check the validity of the provided format TOVALIDATE against SPEC.
 *
 * @param {NumbroFormat} toValidate - format to check
 * @param {*} spec - specification against which to check
 * @param {string} prefix - prefix use for error messages
 * @param {boolean} skipMandatoryCheck - `true` when the check for mandatory key must be skipped
 * @return {boolean} True when everything is correct
 */


function validateSpec(toValidate, spec, prefix) {
  var skipMandatoryCheck = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var results = Object.keys(toValidate).map(function (key) {
    if (!spec[key]) {
      console.error("".concat(prefix, " Invalid key: ").concat(key)); // eslint-disable-line no-console

      return false;
    }

    var value = toValidate[key];
    var data = spec[key];

    if (typeof data === "string") {
      data = {
        type: data
      };
    }

    if (data.type === "format") {
      // all formats are partial (a.k.a will be merged with some default values) thus no need to check mandatory values
      var valid = validateSpec(value, validFormat, "[Validate ".concat(key, "]"), true);

      if (!valid) {
        return false;
      }
    } else if (_typeof(value) !== data.type) {
      console.error("".concat(prefix, " ").concat(key, " type mismatched: \"").concat(data.type, "\" expected, \"").concat(_typeof(value), "\" provided")); // eslint-disable-line no-console

      return false;
    }

    if (data.restrictions && data.restrictions.length) {
      var length = data.restrictions.length;

      for (var i = 0; i < length; i++) {
        var _data$restrictions$i = data.restrictions[i],
            restriction = _data$restrictions$i.restriction,
            message = _data$restrictions$i.message;

        if (!restriction(value, toValidate)) {
          console.error("".concat(prefix, " ").concat(key, " invalid value: ").concat(message)); // eslint-disable-line no-console

          return false;
        }
      }
    }

    if (data.restriction && !data.restriction(value, toValidate)) {
      console.error("".concat(prefix, " ").concat(key, " invalid value: ").concat(data.message)); // eslint-disable-line no-console

      return false;
    }

    if (data.validValues && data.validValues.indexOf(value) === -1) {
      console.error("".concat(prefix, " ").concat(key, " invalid value: must be among ").concat(JSON.stringify(data.validValues), ", \"").concat(value, "\" provided")); // eslint-disable-line no-console

      return false;
    }

    if (data.children) {
      var _valid = validateSpec(value, data.children, "[Validate ".concat(key, "]"));

      if (!_valid) {
        return false;
      }
    }

    return true;
  });

  if (!skipMandatoryCheck) {
    results.push.apply(results, _toConsumableArray(Object.keys(spec).map(function (key) {
      var data = spec[key];

      if (typeof data === "string") {
        data = {
          type: data
        };
      }

      if (data.mandatory) {
        var mandatory = data.mandatory;

        if (typeof mandatory === "function") {
          mandatory = mandatory(toValidate);
        }

        if (mandatory && toValidate[key] === undefined) {
          console.error("".concat(prefix, " Missing mandatory key \"").concat(key, "\"")); // eslint-disable-line no-console

          return false;
        }
      }

      return true;
    })));
  }

  return results.reduce(function (acc, current) {
    return acc && current;
  }, true);
}
/**
 * Check the provided FORMAT.
 *
 * @param {NumbroFormat} format - format to check
 * @return {boolean}
 */


function validateFormat(format) {
  return validateSpec(format, validFormat, "[Validate format]");
}
/**
 * Check the provided LANGUAGE.
 *
 * @param {NumbroLanguage} language - language to check
 * @return {boolean}
 */


function validateLanguage(language) {
  return validateSpec(language, validLanguage, "[Validate language]");
}

module.exports = {
  validate: validate,
  validateFormat: validateFormat,
  validateInput: validateInput,
  validateLanguage: validateLanguage
};

},{"./unformatting":9}]},{},[7])(7)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmlnbnVtYmVyLmpzL2JpZ251bWJlci5qcyIsInNyYy9lbi1VUy5qcyIsInNyYy9mb3JtYXR0aW5nLmpzIiwic3JjL2dsb2JhbFN0YXRlLmpzIiwic3JjL2xvYWRpbmcuanMiLCJzcmMvbWFuaXB1bGF0aW5nLmpzIiwic3JjL251bWJyby5qcyIsInNyYy9wYXJzaW5nLmpzIiwic3JjL3VuZm9ybWF0dGluZy5qcyIsInNyYy92YWxpZGF0aW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QixxQkFBMUIsQ0FBbkI7QUFDSDs7QUFFRCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQUNiLEVBQUEsUUFBUSxFQUFSLFFBRGE7QUFFYixFQUFBLGNBQWMsRUFBZCxjQUZhO0FBR2IsRUFBQSxhQUFhLEVBQWIsYUFIYTtBQUliLEVBQUEsZ0JBQWdCLEVBQWhCO0FBSmEsQ0FBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCI7KGZ1bmN0aW9uIChnbG9iYWxPYmplY3QpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4vKlxyXG4gKiAgICAgIGJpZ251bWJlci5qcyB2OC4xLjFcclxuICogICAgICBBIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgYXJiaXRyYXJ5LXByZWNpc2lvbiBhcml0aG1ldGljLlxyXG4gKiAgICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWtlTWNsL2JpZ251bWJlci5qc1xyXG4gKiAgICAgIENvcHlyaWdodCAoYykgMjAxOSBNaWNoYWVsIE1jbGF1Z2hsaW4gPE04Y2g4OGxAZ21haWwuY29tPlxyXG4gKiAgICAgIE1JVCBMaWNlbnNlZC5cclxuICpcclxuICogICAgICBCaWdOdW1iZXIucHJvdG90eXBlIG1ldGhvZHMgICAgIHwgIEJpZ051bWJlciBtZXRob2RzXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgYWJzb2x1dGVWYWx1ZSAgICAgICAgICAgIGFicyAgICB8ICBjbG9uZVxyXG4gKiAgICAgIGNvbXBhcmVkVG8gICAgICAgICAgICAgICAgICAgICAgfCAgY29uZmlnICAgICAgICAgICAgICAgc2V0XHJcbiAqICAgICAgZGVjaW1hbFBsYWNlcyAgICAgICAgICAgIGRwICAgICB8ICAgICAgREVDSU1BTF9QTEFDRVNcclxuICogICAgICBkaXZpZGVkQnkgICAgICAgICAgICAgICAgZGl2ICAgIHwgICAgICBST1VORElOR19NT0RFXHJcbiAqICAgICAgZGl2aWRlZFRvSW50ZWdlckJ5ICAgICAgIGlkaXYgICB8ICAgICAgRVhQT05FTlRJQUxfQVRcclxuICogICAgICBleHBvbmVudGlhdGVkQnkgICAgICAgICAgcG93ICAgIHwgICAgICBSQU5HRVxyXG4gKiAgICAgIGludGVnZXJWYWx1ZSAgICAgICAgICAgICAgICAgICAgfCAgICAgIENSWVBUT1xyXG4gKiAgICAgIGlzRXF1YWxUbyAgICAgICAgICAgICAgICBlcSAgICAgfCAgICAgIE1PRFVMT19NT0RFXHJcbiAqICAgICAgaXNGaW5pdGUgICAgICAgICAgICAgICAgICAgICAgICB8ICAgICAgUE9XX1BSRUNJU0lPTlxyXG4gKiAgICAgIGlzR3JlYXRlclRoYW4gICAgICAgICAgICBndCAgICAgfCAgICAgIEZPUk1BVFxyXG4gKiAgICAgIGlzR3JlYXRlclRoYW5PckVxdWFsVG8gICBndGUgICAgfCAgICAgIEFMUEhBQkVUXHJcbiAqICAgICAgaXNJbnRlZ2VyICAgICAgICAgICAgICAgICAgICAgICB8ICBpc0JpZ051bWJlclxyXG4gKiAgICAgIGlzTGVzc1RoYW4gICAgICAgICAgICAgICBsdCAgICAgfCAgbWF4aW11bSAgICAgICAgICAgICAgbWF4XHJcbiAqICAgICAgaXNMZXNzVGhhbk9yRXF1YWxUbyAgICAgIGx0ZSAgICB8ICBtaW5pbXVtICAgICAgICAgICAgICBtaW5cclxuICogICAgICBpc05hTiAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgIHJhbmRvbVxyXG4gKiAgICAgIGlzTmVnYXRpdmUgICAgICAgICAgICAgICAgICAgICAgfCAgc3VtXHJcbiAqICAgICAgaXNQb3NpdGl2ZSAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgaXNaZXJvICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgbWludXMgICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgbW9kdWxvICAgICAgICAgICAgICAgICAgIG1vZCAgICB8XHJcbiAqICAgICAgbXVsdGlwbGllZEJ5ICAgICAgICAgICAgIHRpbWVzICB8XHJcbiAqICAgICAgbmVnYXRlZCAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgcGx1cyAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgcHJlY2lzaW9uICAgICAgICAgICAgICAgIHNkICAgICB8XHJcbiAqICAgICAgc2hpZnRlZEJ5ICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgc3F1YXJlUm9vdCAgICAgICAgICAgICAgIHNxcnQgICB8XHJcbiAqICAgICAgdG9FeHBvbmVudGlhbCAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9GaXhlZCAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9Gb3JtYXQgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9GcmFjdGlvbiAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9KU09OICAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9OdW1iZXIgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9QcmVjaXNpb24gICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdG9TdHJpbmcgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqICAgICAgdmFsdWVPZiAgICAgICAgICAgICAgICAgICAgICAgICB8XHJcbiAqXHJcbiAqL1xyXG5cclxuXHJcbiAgdmFyIEJpZ051bWJlcixcclxuICAgIGlzTnVtZXJpYyA9IC9eLT8oPzpcXGQrKD86XFwuXFxkKik/fFxcLlxcZCspKD86ZVsrLV0/XFxkKyk/JC9pLFxyXG4gICAgaGFzU3ltYm9sID0gdHlwZW9mIFN5bWJvbCA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT0gJ3N5bWJvbCcsXHJcblxyXG4gICAgbWF0aGNlaWwgPSBNYXRoLmNlaWwsXHJcbiAgICBtYXRoZmxvb3IgPSBNYXRoLmZsb29yLFxyXG5cclxuICAgIGJpZ251bWJlckVycm9yID0gJ1tCaWdOdW1iZXIgRXJyb3JdICcsXHJcbiAgICB0b29NYW55RGlnaXRzID0gYmlnbnVtYmVyRXJyb3IgKyAnTnVtYmVyIHByaW1pdGl2ZSBoYXMgbW9yZSB0aGFuIDE1IHNpZ25pZmljYW50IGRpZ2l0czogJyxcclxuXHJcbiAgICBCQVNFID0gMWUxNCxcclxuICAgIExPR19CQVNFID0gMTQsXHJcbiAgICBNQVhfU0FGRV9JTlRFR0VSID0gMHgxZmZmZmZmZmZmZmZmZiwgICAgICAgICAvLyAyXjUzIC0gMVxyXG4gICAgLy8gTUFYX0lOVDMyID0gMHg3ZmZmZmZmZiwgICAgICAgICAgICAgICAgICAgLy8gMl4zMSAtIDFcclxuICAgIFBPV1NfVEVOID0gWzEsIDEwLCAxMDAsIDFlMywgMWU0LCAxZTUsIDFlNiwgMWU3LCAxZTgsIDFlOSwgMWUxMCwgMWUxMSwgMWUxMiwgMWUxM10sXHJcbiAgICBTUVJUX0JBU0UgPSAxZTcsXHJcblxyXG4gICAgLy8gRURJVEFCTEVcclxuICAgIC8vIFRoZSBsaW1pdCBvbiB0aGUgdmFsdWUgb2YgREVDSU1BTF9QTEFDRVMsIFRPX0VYUF9ORUcsIFRPX0VYUF9QT1MsIE1JTl9FWFAsIE1BWF9FWFAsIGFuZFxyXG4gICAgLy8gdGhlIGFyZ3VtZW50cyB0byB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkLCB0b0Zvcm1hdCwgYW5kIHRvUHJlY2lzaW9uLlxyXG4gICAgTUFYID0gMUU5OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhfSU5UMzJcclxuXHJcblxyXG4gIC8qXHJcbiAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBCaWdOdW1iZXIgY29uc3RydWN0b3IuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY2xvbmUoY29uZmlnT2JqZWN0KSB7XHJcbiAgICB2YXIgZGl2LCBjb252ZXJ0QmFzZSwgcGFyc2VOdW1lcmljLFxyXG4gICAgICBQID0gQmlnTnVtYmVyLnByb3RvdHlwZSA9IHsgY29uc3RydWN0b3I6IEJpZ051bWJlciwgdG9TdHJpbmc6IG51bGwsIHZhbHVlT2Y6IG51bGwgfSxcclxuICAgICAgT05FID0gbmV3IEJpZ051bWJlcigxKSxcclxuXHJcblxyXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEVESVRBQkxFIENPTkZJRyBERUZBVUxUUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cclxuICAgICAgLy8gVGhlIGRlZmF1bHQgdmFsdWVzIGJlbG93IG11c3QgYmUgaW50ZWdlcnMgd2l0aGluIHRoZSBpbmNsdXNpdmUgcmFuZ2VzIHN0YXRlZC5cclxuICAgICAgLy8gVGhlIHZhbHVlcyBjYW4gYWxzbyBiZSBjaGFuZ2VkIGF0IHJ1bi10aW1lIHVzaW5nIEJpZ051bWJlci5zZXQuXHJcblxyXG4gICAgICAvLyBUaGUgbWF4aW11bSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXMgZm9yIG9wZXJhdGlvbnMgaW52b2x2aW5nIGRpdmlzaW9uLlxyXG4gICAgICBERUNJTUFMX1BMQUNFUyA9IDIwLCAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYXHJcblxyXG4gICAgICAvLyBUaGUgcm91bmRpbmcgbW9kZSB1c2VkIHdoZW4gcm91bmRpbmcgdG8gdGhlIGFib3ZlIGRlY2ltYWwgcGxhY2VzLCBhbmQgd2hlbiB1c2luZ1xyXG4gICAgICAvLyB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkLCB0b0Zvcm1hdCBhbmQgdG9QcmVjaXNpb24sIGFuZCByb3VuZCAoZGVmYXVsdCB2YWx1ZSkuXHJcbiAgICAgIC8vIFVQICAgICAgICAgMCBBd2F5IGZyb20gemVyby5cclxuICAgICAgLy8gRE9XTiAgICAgICAxIFRvd2FyZHMgemVyby5cclxuICAgICAgLy8gQ0VJTCAgICAgICAyIFRvd2FyZHMgK0luZmluaXR5LlxyXG4gICAgICAvLyBGTE9PUiAgICAgIDMgVG93YXJkcyAtSW5maW5pdHkuXHJcbiAgICAgIC8vIEhBTEZfVVAgICAgNCBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgdXAuXHJcbiAgICAgIC8vIEhBTEZfRE9XTiAgNSBUb3dhcmRzIG5lYXJlc3QgbmVpZ2hib3VyLiBJZiBlcXVpZGlzdGFudCwgZG93bi5cclxuICAgICAgLy8gSEFMRl9FVkVOICA2IFRvd2FyZHMgbmVhcmVzdCBuZWlnaGJvdXIuIElmIGVxdWlkaXN0YW50LCB0b3dhcmRzIGV2ZW4gbmVpZ2hib3VyLlxyXG4gICAgICAvLyBIQUxGX0NFSUwgIDcgVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvd2FyZHMgK0luZmluaXR5LlxyXG4gICAgICAvLyBIQUxGX0ZMT09SIDggVG93YXJkcyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvd2FyZHMgLUluZmluaXR5LlxyXG4gICAgICBST1VORElOR19NT0RFID0gNCwgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gOFxyXG5cclxuICAgICAgLy8gRVhQT05FTlRJQUxfQVQgOiBbVE9fRVhQX05FRyAsIFRPX0VYUF9QT1NdXHJcblxyXG4gICAgICAvLyBUaGUgZXhwb25lbnQgdmFsdWUgYXQgYW5kIGJlbmVhdGggd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgLy8gTnVtYmVyIHR5cGU6IC03XHJcbiAgICAgIFRPX0VYUF9ORUcgPSAtNywgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byAtTUFYXHJcblxyXG4gICAgICAvLyBUaGUgZXhwb25lbnQgdmFsdWUgYXQgYW5kIGFib3ZlIHdoaWNoIHRvU3RyaW5nIHJldHVybnMgZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgIC8vIE51bWJlciB0eXBlOiAyMVxyXG4gICAgICBUT19FWFBfUE9TID0gMjEsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gTUFYXHJcblxyXG4gICAgICAvLyBSQU5HRSA6IFtNSU5fRVhQLCBNQVhfRVhQXVxyXG5cclxuICAgICAgLy8gVGhlIG1pbmltdW0gZXhwb25lbnQgdmFsdWUsIGJlbmVhdGggd2hpY2ggdW5kZXJmbG93IHRvIHplcm8gb2NjdXJzLlxyXG4gICAgICAvLyBOdW1iZXIgdHlwZTogLTMyNCAgKDVlLTMyNClcclxuICAgICAgTUlOX0VYUCA9IC0xZTcsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAtMSB0byAtTUFYXHJcblxyXG4gICAgICAvLyBUaGUgbWF4aW11bSBleHBvbmVudCB2YWx1ZSwgYWJvdmUgd2hpY2ggb3ZlcmZsb3cgdG8gSW5maW5pdHkgb2NjdXJzLlxyXG4gICAgICAvLyBOdW1iZXIgdHlwZTogIDMwOCAgKDEuNzk3NjkzMTM0ODYyMzE1N2UrMzA4KVxyXG4gICAgICAvLyBGb3IgTUFYX0VYUCA+IDFlNywgZS5nLiBuZXcgQmlnTnVtYmVyKCcxZTEwMDAwMDAwMCcpLnBsdXMoMSkgbWF5IGJlIHNsb3cuXHJcbiAgICAgIE1BWF9FWFAgPSAxZTcsICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMSB0byBNQVhcclxuXHJcbiAgICAgIC8vIFdoZXRoZXIgdG8gdXNlIGNyeXB0b2dyYXBoaWNhbGx5LXNlY3VyZSByYW5kb20gbnVtYmVyIGdlbmVyYXRpb24sIGlmIGF2YWlsYWJsZS5cclxuICAgICAgQ1JZUFRPID0gZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0cnVlIG9yIGZhbHNlXHJcblxyXG4gICAgICAvLyBUaGUgbW9kdWxvIG1vZGUgdXNlZCB3aGVuIGNhbGN1bGF0aW5nIHRoZSBtb2R1bHVzOiBhIG1vZCBuLlxyXG4gICAgICAvLyBUaGUgcXVvdGllbnQgKHEgPSBhIC8gbikgaXMgY2FsY3VsYXRlZCBhY2NvcmRpbmcgdG8gdGhlIGNvcnJlc3BvbmRpbmcgcm91bmRpbmcgbW9kZS5cclxuICAgICAgLy8gVGhlIHJlbWFpbmRlciAocikgaXMgY2FsY3VsYXRlZCBhczogciA9IGEgLSBuICogcS5cclxuICAgICAgLy9cclxuICAgICAgLy8gVVAgICAgICAgIDAgVGhlIHJlbWFpbmRlciBpcyBwb3NpdGl2ZSBpZiB0aGUgZGl2aWRlbmQgaXMgbmVnYXRpdmUsIGVsc2UgaXMgbmVnYXRpdmUuXHJcbiAgICAgIC8vIERPV04gICAgICAxIFRoZSByZW1haW5kZXIgaGFzIHRoZSBzYW1lIHNpZ24gYXMgdGhlIGRpdmlkZW5kLlxyXG4gICAgICAvLyAgICAgICAgICAgICBUaGlzIG1vZHVsbyBtb2RlIGlzIGNvbW1vbmx5IGtub3duIGFzICd0cnVuY2F0ZWQgZGl2aXNpb24nIGFuZCBpc1xyXG4gICAgICAvLyAgICAgICAgICAgICBlcXVpdmFsZW50IHRvIChhICUgbikgaW4gSmF2YVNjcmlwdC5cclxuICAgICAgLy8gRkxPT1IgICAgIDMgVGhlIHJlbWFpbmRlciBoYXMgdGhlIHNhbWUgc2lnbiBhcyB0aGUgZGl2aXNvciAoUHl0aG9uICUpLlxyXG4gICAgICAvLyBIQUxGX0VWRU4gNiBUaGlzIG1vZHVsbyBtb2RlIGltcGxlbWVudHMgdGhlIElFRUUgNzU0IHJlbWFpbmRlciBmdW5jdGlvbi5cclxuICAgICAgLy8gRVVDTElEICAgIDkgRXVjbGlkaWFuIGRpdmlzaW9uLiBxID0gc2lnbihuKSAqIGZsb29yKGEgLyBhYnMobikpLlxyXG4gICAgICAvLyAgICAgICAgICAgICBUaGUgcmVtYWluZGVyIGlzIGFsd2F5cyBwb3NpdGl2ZS5cclxuICAgICAgLy9cclxuICAgICAgLy8gVGhlIHRydW5jYXRlZCBkaXZpc2lvbiwgZmxvb3JlZCBkaXZpc2lvbiwgRXVjbGlkaWFuIGRpdmlzaW9uIGFuZCBJRUVFIDc1NCByZW1haW5kZXJcclxuICAgICAgLy8gbW9kZXMgYXJlIGNvbW1vbmx5IHVzZWQgZm9yIHRoZSBtb2R1bHVzIG9wZXJhdGlvbi5cclxuICAgICAgLy8gQWx0aG91Z2ggdGhlIG90aGVyIHJvdW5kaW5nIG1vZGVzIGNhbiBhbHNvIGJlIHVzZWQsIHRoZXkgbWF5IG5vdCBnaXZlIHVzZWZ1bCByZXN1bHRzLlxyXG4gICAgICBNT0RVTE9fTU9ERSA9IDEsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gOVxyXG5cclxuICAgICAgLy8gVGhlIG1heGltdW0gbnVtYmVyIG9mIHNpZ25pZmljYW50IGRpZ2l0cyBvZiB0aGUgcmVzdWx0IG9mIHRoZSBleHBvbmVudGlhdGVkQnkgb3BlcmF0aW9uLlxyXG4gICAgICAvLyBJZiBQT1dfUFJFQ0lTSU9OIGlzIDAsIHRoZXJlIHdpbGwgYmUgdW5saW1pdGVkIHNpZ25pZmljYW50IGRpZ2l0cy5cclxuICAgICAgUE9XX1BSRUNJU0lPTiA9IDAsICAgICAgICAgICAgICAgICAgICAvLyAwIHRvIE1BWFxyXG5cclxuICAgICAgLy8gVGhlIGZvcm1hdCBzcGVjaWZpY2F0aW9uIHVzZWQgYnkgdGhlIEJpZ051bWJlci5wcm90b3R5cGUudG9Gb3JtYXQgbWV0aG9kLlxyXG4gICAgICBGT1JNQVQgPSB7XHJcbiAgICAgICAgcHJlZml4OiAnJyxcclxuICAgICAgICBncm91cFNpemU6IDMsXHJcbiAgICAgICAgc2Vjb25kYXJ5R3JvdXBTaXplOiAwLFxyXG4gICAgICAgIGdyb3VwU2VwYXJhdG9yOiAnLCcsXHJcbiAgICAgICAgZGVjaW1hbFNlcGFyYXRvcjogJy4nLFxyXG4gICAgICAgIGZyYWN0aW9uR3JvdXBTaXplOiAwLFxyXG4gICAgICAgIGZyYWN0aW9uR3JvdXBTZXBhcmF0b3I6ICdcXHhBMCcsICAgICAgLy8gbm9uLWJyZWFraW5nIHNwYWNlXHJcbiAgICAgICAgc3VmZml4OiAnJ1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gVGhlIGFscGhhYmV0IHVzZWQgZm9yIGJhc2UgY29udmVyc2lvbi4gSXQgbXVzdCBiZSBhdCBsZWFzdCAyIGNoYXJhY3RlcnMgbG9uZywgd2l0aCBubyAnKycsXHJcbiAgICAgIC8vICctJywgJy4nLCB3aGl0ZXNwYWNlLCBvciByZXBlYXRlZCBjaGFyYWN0ZXIuXHJcbiAgICAgIC8vICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWiRfJ1xyXG4gICAgICBBTFBIQUJFVCA9ICcwMTIzNDU2Nzg5YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonO1xyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHJcbiAgICAvLyBDT05TVFJVQ1RPUlxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogVGhlIEJpZ051bWJlciBjb25zdHJ1Y3RvciBhbmQgZXhwb3J0ZWQgZnVuY3Rpb24uXHJcbiAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIG5ldyBpbnN0YW5jZSBvZiBhIEJpZ051bWJlciBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogdiB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9IEEgbnVtZXJpYyB2YWx1ZS5cclxuICAgICAqIFtiXSB7bnVtYmVyfSBUaGUgYmFzZSBvZiB2LiBJbnRlZ2VyLCAyIHRvIEFMUEhBQkVULmxlbmd0aCBpbmNsdXNpdmUuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIEJpZ051bWJlcih2LCBiKSB7XHJcbiAgICAgIHZhciBhbHBoYWJldCwgYywgY2FzZUNoYW5nZWQsIGUsIGksIGlzTnVtLCBsZW4sIHN0cixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIC8vIEVuYWJsZSBjb25zdHJ1Y3RvciBjYWxsIHdpdGhvdXQgYG5ld2AuXHJcbiAgICAgIGlmICghKHggaW5zdGFuY2VvZiBCaWdOdW1iZXIpKSByZXR1cm4gbmV3IEJpZ051bWJlcih2LCBiKTtcclxuXHJcbiAgICAgIGlmIChiID09IG51bGwpIHtcclxuXHJcbiAgICAgICAgaWYgKHYgJiYgdi5faXNCaWdOdW1iZXIgPT09IHRydWUpIHtcclxuICAgICAgICAgIHgucyA9IHYucztcclxuXHJcbiAgICAgICAgICBpZiAoIXYuYyB8fCB2LmUgPiBNQVhfRVhQKSB7XHJcbiAgICAgICAgICAgIHguYyA9IHguZSA9IG51bGw7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHYuZSA8IE1JTl9FWFApIHtcclxuICAgICAgICAgICAgeC5jID0gW3guZSA9IDBdO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgeC5lID0gdi5lO1xyXG4gICAgICAgICAgICB4LmMgPSB2LmMuc2xpY2UoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoKGlzTnVtID0gdHlwZW9mIHYgPT0gJ251bWJlcicpICYmIHYgKiAwID09IDApIHtcclxuXHJcbiAgICAgICAgICAvLyBVc2UgYDEgLyBuYCB0byBoYW5kbGUgbWludXMgemVybyBhbHNvLlxyXG4gICAgICAgICAgeC5zID0gMSAvIHYgPCAwID8gKHYgPSAtdiwgLTEpIDogMTtcclxuXHJcbiAgICAgICAgICAvLyBGYXN0IHBhdGggZm9yIGludGVnZXJzLCB3aGVyZSBuIDwgMjE0NzQ4MzY0OCAoMioqMzEpLlxyXG4gICAgICAgICAgaWYgKHYgPT09IH5+dikge1xyXG4gICAgICAgICAgICBmb3IgKGUgPSAwLCBpID0gdjsgaSA+PSAxMDsgaSAvPSAxMCwgZSsrKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChlID4gTUFYX0VYUCkge1xyXG4gICAgICAgICAgICAgIHguYyA9IHguZSA9IG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgeC5lID0gZTtcclxuICAgICAgICAgICAgICB4LmMgPSBbdl07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBzdHIgPSBTdHJpbmcodik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICBpZiAoIWlzTnVtZXJpYy50ZXN0KHN0ciA9IFN0cmluZyh2KSkpIHJldHVybiBwYXJzZU51bWVyaWMoeCwgc3RyLCBpc051bSk7XHJcblxyXG4gICAgICAgICAgeC5zID0gc3RyLmNoYXJDb2RlQXQoMCkgPT0gNDUgPyAoc3RyID0gc3RyLnNsaWNlKDEpLCAtMSkgOiAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGVjaW1hbCBwb2ludD9cclxuICAgICAgICBpZiAoKGUgPSBzdHIuaW5kZXhPZignLicpKSA+IC0xKSBzdHIgPSBzdHIucmVwbGFjZSgnLicsICcnKTtcclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnRpYWwgZm9ybT9cclxuICAgICAgICBpZiAoKGkgPSBzdHIuc2VhcmNoKC9lL2kpKSA+IDApIHtcclxuXHJcbiAgICAgICAgICAvLyBEZXRlcm1pbmUgZXhwb25lbnQuXHJcbiAgICAgICAgICBpZiAoZSA8IDApIGUgPSBpO1xyXG4gICAgICAgICAgZSArPSArc3RyLnNsaWNlKGkgKyAxKTtcclxuICAgICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgaSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlIDwgMCkge1xyXG5cclxuICAgICAgICAgIC8vIEludGVnZXIuXHJcbiAgICAgICAgICBlID0gc3RyLmxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gQmFzZSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7Yn0nXHJcbiAgICAgICAgaW50Q2hlY2soYiwgMiwgQUxQSEFCRVQubGVuZ3RoLCAnQmFzZScpO1xyXG5cclxuICAgICAgICAvLyBBbGxvdyBleHBvbmVudGlhbCBub3RhdGlvbiB0byBiZSB1c2VkIHdpdGggYmFzZSAxMCBhcmd1bWVudCwgd2hpbGVcclxuICAgICAgICAvLyBhbHNvIHJvdW5kaW5nIHRvIERFQ0lNQUxfUExBQ0VTIGFzIHdpdGggb3RoZXIgYmFzZXMuXHJcbiAgICAgICAgaWYgKGIgPT0gMTApIHtcclxuICAgICAgICAgIHggPSBuZXcgQmlnTnVtYmVyKHYpO1xyXG4gICAgICAgICAgcmV0dXJuIHJvdW5kKHgsIERFQ0lNQUxfUExBQ0VTICsgeC5lICsgMSwgUk9VTkRJTkdfTU9ERSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdHIgPSBTdHJpbmcodik7XHJcblxyXG4gICAgICAgIGlmIChpc051bSA9IHR5cGVvZiB2ID09ICdudW1iZXInKSB7XHJcblxyXG4gICAgICAgICAgLy8gQXZvaWQgcG90ZW50aWFsIGludGVycHJldGF0aW9uIG9mIEluZmluaXR5IGFuZCBOYU4gYXMgYmFzZSA0NCsgdmFsdWVzLlxyXG4gICAgICAgICAgaWYgKHYgKiAwICE9IDApIHJldHVybiBwYXJzZU51bWVyaWMoeCwgc3RyLCBpc051bSwgYik7XHJcblxyXG4gICAgICAgICAgeC5zID0gMSAvIHYgPCAwID8gKHN0ciA9IHN0ci5zbGljZSgxKSwgLTEpIDogMTtcclxuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gTnVtYmVyIHByaW1pdGl2ZSBoYXMgbW9yZSB0aGFuIDE1IHNpZ25pZmljYW50IGRpZ2l0czoge259J1xyXG4gICAgICAgICAgaWYgKEJpZ051bWJlci5ERUJVRyAmJiBzdHIucmVwbGFjZSgvXjBcXC4wKnxcXC4vLCAnJykubGVuZ3RoID4gMTUpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgICh0b29NYW55RGlnaXRzICsgdik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHgucyA9IHN0ci5jaGFyQ29kZUF0KDApID09PSA0NSA/IChzdHIgPSBzdHIuc2xpY2UoMSksIC0xKSA6IDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhbHBoYWJldCA9IEFMUEhBQkVULnNsaWNlKDAsIGIpO1xyXG4gICAgICAgIGUgPSBpID0gMDtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgdGhhdCBzdHIgaXMgYSB2YWxpZCBiYXNlIGIgbnVtYmVyLlxyXG4gICAgICAgIC8vIERvbid0IHVzZSBSZWdFeHAsIHNvIGFscGhhYmV0IGNhbiBjb250YWluIHNwZWNpYWwgY2hhcmFjdGVycy5cclxuICAgICAgICBmb3IgKGxlbiA9IHN0ci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgaWYgKGFscGhhYmV0LmluZGV4T2YoYyA9IHN0ci5jaGFyQXQoaSkpIDwgMCkge1xyXG4gICAgICAgICAgICBpZiAoYyA9PSAnLicpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSWYgJy4nIGlzIG5vdCB0aGUgZmlyc3QgY2hhcmFjdGVyIGFuZCBpdCBoYXMgbm90IGJlIGZvdW5kIGJlZm9yZS5cclxuICAgICAgICAgICAgICBpZiAoaSA+IGUpIHtcclxuICAgICAgICAgICAgICAgIGUgPSBsZW47XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWNhc2VDaGFuZ2VkKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEFsbG93IGUuZy4gaGV4YWRlY2ltYWwgJ0ZGJyBhcyB3ZWxsIGFzICdmZicuXHJcbiAgICAgICAgICAgICAgaWYgKHN0ciA9PSBzdHIudG9VcHBlckNhc2UoKSAmJiAoc3RyID0gc3RyLnRvTG93ZXJDYXNlKCkpIHx8XHJcbiAgICAgICAgICAgICAgICAgIHN0ciA9PSBzdHIudG9Mb3dlckNhc2UoKSAmJiAoc3RyID0gc3RyLnRvVXBwZXJDYXNlKCkpKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlQ2hhbmdlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpID0gLTE7XHJcbiAgICAgICAgICAgICAgICBlID0gMDtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHBhcnNlTnVtZXJpYyh4LCBTdHJpbmcodiksIGlzTnVtLCBiKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFByZXZlbnQgbGF0ZXIgY2hlY2sgZm9yIGxlbmd0aCBvbiBjb252ZXJ0ZWQgbnVtYmVyLlxyXG4gICAgICAgIGlzTnVtID0gZmFsc2U7XHJcbiAgICAgICAgc3RyID0gY29udmVydEJhc2Uoc3RyLCBiLCAxMCwgeC5zKTtcclxuXHJcbiAgICAgICAgLy8gRGVjaW1hbCBwb2ludD9cclxuICAgICAgICBpZiAoKGUgPSBzdHIuaW5kZXhPZignLicpKSA+IC0xKSBzdHIgPSBzdHIucmVwbGFjZSgnLicsICcnKTtcclxuICAgICAgICBlbHNlIGUgPSBzdHIubGVuZ3RoO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBEZXRlcm1pbmUgbGVhZGluZyB6ZXJvcy5cclxuICAgICAgZm9yIChpID0gMDsgc3RyLmNoYXJDb2RlQXQoaSkgPT09IDQ4OyBpKyspO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICBmb3IgKGxlbiA9IHN0ci5sZW5ndGg7IHN0ci5jaGFyQ29kZUF0KC0tbGVuKSA9PT0gNDg7KTtcclxuXHJcbiAgICAgIGlmIChzdHIgPSBzdHIuc2xpY2UoaSwgKytsZW4pKSB7XHJcbiAgICAgICAgbGVuIC09IGk7XHJcblxyXG4gICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBOdW1iZXIgcHJpbWl0aXZlIGhhcyBtb3JlIHRoYW4gMTUgc2lnbmlmaWNhbnQgZGlnaXRzOiB7bn0nXHJcbiAgICAgICAgaWYgKGlzTnVtICYmIEJpZ051bWJlci5ERUJVRyAmJlxyXG4gICAgICAgICAgbGVuID4gMTUgJiYgKHYgPiBNQVhfU0FGRV9JTlRFR0VSIHx8IHYgIT09IG1hdGhmbG9vcih2KSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgICh0b29NYW55RGlnaXRzICsgKHgucyAqIHYpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICAvLyBPdmVyZmxvdz9cclxuICAgICAgICBpZiAoKGUgPSBlIC0gaSAtIDEpID4gTUFYX0VYUCkge1xyXG5cclxuICAgICAgICAgIC8vIEluZmluaXR5LlxyXG4gICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gVW5kZXJmbG93P1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZSA8IE1JTl9FWFApIHtcclxuXHJcbiAgICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgICAgeC5jID0gW3guZSA9IDBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4LmUgPSBlO1xyXG4gICAgICAgICAgeC5jID0gW107XHJcblxyXG4gICAgICAgICAgLy8gVHJhbnNmb3JtIGJhc2VcclxuXHJcbiAgICAgICAgICAvLyBlIGlzIHRoZSBiYXNlIDEwIGV4cG9uZW50LlxyXG4gICAgICAgICAgLy8gaSBpcyB3aGVyZSB0byBzbGljZSBzdHIgdG8gZ2V0IHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBjb2VmZmljaWVudCBhcnJheS5cclxuICAgICAgICAgIGkgPSAoZSArIDEpICUgTE9HX0JBU0U7XHJcbiAgICAgICAgICBpZiAoZSA8IDApIGkgKz0gTE9HX0JBU0U7ICAvLyBpIDwgMVxyXG5cclxuICAgICAgICAgIGlmIChpIDwgbGVuKSB7XHJcbiAgICAgICAgICAgIGlmIChpKSB4LmMucHVzaCgrc3RyLnNsaWNlKDAsIGkpKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGVuIC09IExPR19CQVNFOyBpIDwgbGVuOykge1xyXG4gICAgICAgICAgICAgIHguYy5wdXNoKCtzdHIuc2xpY2UoaSwgaSArPSBMT0dfQkFTRSkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpID0gTE9HX0JBU0UgLSAoc3RyID0gc3RyLnNsaWNlKGkpKS5sZW5ndGg7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpIC09IGxlbjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBmb3IgKDsgaS0tOyBzdHIgKz0gJzAnKTtcclxuICAgICAgICAgIHguYy5wdXNoKCtzdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gWmVyby5cclxuICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gQ09OU1RSVUNUT1IgUFJPUEVSVElFU1xyXG5cclxuXHJcbiAgICBCaWdOdW1iZXIuY2xvbmUgPSBjbG9uZTtcclxuXHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfVVAgPSAwO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0RPV04gPSAxO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0NFSUwgPSAyO1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0ZMT09SID0gMztcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX1VQID0gNDtcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX0RPV04gPSA1O1xyXG4gICAgQmlnTnVtYmVyLlJPVU5EX0hBTEZfRVZFTiA9IDY7XHJcbiAgICBCaWdOdW1iZXIuUk9VTkRfSEFMRl9DRUlMID0gNztcclxuICAgIEJpZ051bWJlci5ST1VORF9IQUxGX0ZMT09SID0gODtcclxuICAgIEJpZ051bWJlci5FVUNMSUQgPSA5O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogQ29uZmlndXJlIGluZnJlcXVlbnRseS1jaGFuZ2luZyBsaWJyYXJ5LXdpZGUgc2V0dGluZ3MuXHJcbiAgICAgKlxyXG4gICAgICogQWNjZXB0IGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgb3B0aW9uYWwgcHJvcGVydGllcyAoaWYgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaXNcclxuICAgICAqIGEgbnVtYmVyLCBpdCBtdXN0IGJlIGFuIGludGVnZXIgd2l0aGluIHRoZSBpbmNsdXNpdmUgcmFuZ2Ugc3RhdGVkKTpcclxuICAgICAqXHJcbiAgICAgKiAgIERFQ0lNQUxfUExBQ0VTICAge251bWJlcn0gICAgICAgICAgIDAgdG8gTUFYXHJcbiAgICAgKiAgIFJPVU5ESU5HX01PREUgICAge251bWJlcn0gICAgICAgICAgIDAgdG8gOFxyXG4gICAgICogICBFWFBPTkVOVElBTF9BVCAgIHtudW1iZXJ8bnVtYmVyW119ICAtTUFYIHRvIE1BWCAgb3IgIFstTUFYIHRvIDAsIDAgdG8gTUFYXVxyXG4gICAgICogICBSQU5HRSAgICAgICAgICAgIHtudW1iZXJ8bnVtYmVyW119ICAtTUFYIHRvIE1BWCAobm90IHplcm8pICBvciAgWy1NQVggdG8gLTEsIDEgdG8gTUFYXVxyXG4gICAgICogICBDUllQVE8gICAgICAgICAgIHtib29sZWFufSAgICAgICAgICB0cnVlIG9yIGZhbHNlXHJcbiAgICAgKiAgIE1PRFVMT19NT0RFICAgICAge251bWJlcn0gICAgICAgICAgIDAgdG8gOVxyXG4gICAgICogICBQT1dfUFJFQ0lTSU9OICAgICAgIHtudW1iZXJ9ICAgICAgICAgICAwIHRvIE1BWFxyXG4gICAgICogICBBTFBIQUJFVCAgICAgICAgIHtzdHJpbmd9ICAgICAgICAgICBBIHN0cmluZyBvZiB0d28gb3IgbW9yZSB1bmlxdWUgY2hhcmFjdGVycyB3aGljaCBkb2VzXHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdCBjb250YWluICcuJy5cclxuICAgICAqICAgRk9STUFUICAgICAgICAgICB7b2JqZWN0fSAgICAgICAgICAgQW4gb2JqZWN0IHdpdGggc29tZSBvZiB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XHJcbiAgICAgKiAgICAgcHJlZml4ICAgICAgICAgICAgICAgICB7c3RyaW5nfVxyXG4gICAgICogICAgIGdyb3VwU2l6ZSAgICAgICAgICAgICAge251bWJlcn1cclxuICAgICAqICAgICBzZWNvbmRhcnlHcm91cFNpemUgICAgIHtudW1iZXJ9XHJcbiAgICAgKiAgICAgZ3JvdXBTZXBhcmF0b3IgICAgICAgICB7c3RyaW5nfVxyXG4gICAgICogICAgIGRlY2ltYWxTZXBhcmF0b3IgICAgICAge3N0cmluZ31cclxuICAgICAqICAgICBmcmFjdGlvbkdyb3VwU2l6ZSAgICAgIHtudW1iZXJ9XHJcbiAgICAgKiAgICAgZnJhY3Rpb25Hcm91cFNlcGFyYXRvciB7c3RyaW5nfVxyXG4gICAgICogICAgIHN1ZmZpeCAgICAgICAgICAgICAgICAge3N0cmluZ31cclxuICAgICAqXHJcbiAgICAgKiAoVGhlIHZhbHVlcyBhc3NpZ25lZCB0byB0aGUgYWJvdmUgRk9STUFUIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3QgY2hlY2tlZCBmb3IgdmFsaWRpdHkuKVxyXG4gICAgICpcclxuICAgICAqIEUuZy5cclxuICAgICAqIEJpZ051bWJlci5jb25maWcoeyBERUNJTUFMX1BMQUNFUyA6IDIwLCBST1VORElOR19NT0RFIDogNCB9KVxyXG4gICAgICpcclxuICAgICAqIElnbm9yZSBwcm9wZXJ0aWVzL3BhcmFtZXRlcnMgc2V0IHRvIG51bGwgb3IgdW5kZWZpbmVkLCBleGNlcHQgZm9yIEFMUEhBQkVULlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhbiBvYmplY3Qgd2l0aCB0aGUgcHJvcGVydGllcyBjdXJyZW50IHZhbHVlcy5cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLmNvbmZpZyA9IEJpZ051bWJlci5zZXQgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgICAgIHZhciBwLCB2O1xyXG5cclxuICAgICAgaWYgKG9iaiAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09ICdvYmplY3QnKSB7XHJcblxyXG4gICAgICAgICAgLy8gREVDSU1BTF9QTEFDRVMge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIERFQ0lNQUxfUExBQ0VTIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdERUNJTUFMX1BMQUNFUycpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIE1BWCwgcCk7XHJcbiAgICAgICAgICAgIERFQ0lNQUxfUExBQ0VTID0gdjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBST1VORElOR19NT0RFIHtudW1iZXJ9IEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gUk9VTkRJTkdfTU9ERSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnUk9VTkRJTkdfTU9ERScpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGludENoZWNrKHYsIDAsIDgsIHApO1xyXG4gICAgICAgICAgICBST1VORElOR19NT0RFID0gdjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBFWFBPTkVOVElBTF9BVCB7bnVtYmVyfG51bWJlcltdfVxyXG4gICAgICAgICAgLy8gSW50ZWdlciwgLU1BWCB0byBNQVggaW5jbHVzaXZlIG9yXHJcbiAgICAgICAgICAvLyBbaW50ZWdlciAtTUFYIHRvIDAgaW5jbHVzaXZlLCAwIHRvIE1BWCBpbmNsdXNpdmVdLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIEVYUE9ORU5USUFMX0FUIHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHt2fSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdFWFBPTkVOVElBTF9BVCcpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGlmICh2ICYmIHYucG9wKSB7XHJcbiAgICAgICAgICAgICAgaW50Q2hlY2sodlswXSwgLU1BWCwgMCwgcCk7XHJcbiAgICAgICAgICAgICAgaW50Q2hlY2sodlsxXSwgMCwgTUFYLCBwKTtcclxuICAgICAgICAgICAgICBUT19FWFBfTkVHID0gdlswXTtcclxuICAgICAgICAgICAgICBUT19FWFBfUE9TID0gdlsxXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2LCAtTUFYLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIFRPX0VYUF9ORUcgPSAtKFRPX0VYUF9QT1MgPSB2IDwgMCA/IC12IDogdik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSQU5HRSB7bnVtYmVyfG51bWJlcltdfSBOb24temVybyBpbnRlZ2VyLCAtTUFYIHRvIE1BWCBpbmNsdXNpdmUgb3JcclxuICAgICAgICAgIC8vIFtpbnRlZ2VyIC1NQVggdG8gLTEgaW5jbHVzaXZlLCBpbnRlZ2VyIDEgdG8gTUFYIGluY2x1c2l2ZV0uXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gUkFOR0Uge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfGNhbm5vdCBiZSB6ZXJvfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ1JBTkdFJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuICAgICAgICAgICAgaWYgKHYgJiYgdi5wb3ApIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2WzBdLCAtTUFYLCAtMSwgcCk7XHJcbiAgICAgICAgICAgICAgaW50Q2hlY2sodlsxXSwgMSwgTUFYLCBwKTtcclxuICAgICAgICAgICAgICBNSU5fRVhQID0gdlswXTtcclxuICAgICAgICAgICAgICBNQVhfRVhQID0gdlsxXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBpbnRDaGVjayh2LCAtTUFYLCBNQVgsIHApO1xyXG4gICAgICAgICAgICAgIGlmICh2KSB7XHJcbiAgICAgICAgICAgICAgICBNSU5fRVhQID0gLShNQVhfRVhQID0gdiA8IDAgPyAtdiA6IHYpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArIHAgKyAnIGNhbm5vdCBiZSB6ZXJvOiAnICsgdik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ1JZUFRPIHtib29sZWFufSB0cnVlIG9yIGZhbHNlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIENSWVBUTyBub3QgdHJ1ZSBvciBmYWxzZToge3Z9J1xyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIGNyeXB0byB1bmF2YWlsYWJsZSdcclxuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocCA9ICdDUllQVE8nKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpZiAodiA9PT0gISF2KSB7XHJcbiAgICAgICAgICAgICAgaWYgKHYpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY3J5cHRvICE9ICd1bmRlZmluZWQnICYmIGNyeXB0byAmJlxyXG4gICAgICAgICAgICAgICAgIChjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzIHx8IGNyeXB0by5yYW5kb21CeXRlcykpIHtcclxuICAgICAgICAgICAgICAgICAgQ1JZUFRPID0gdjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIENSWVBUTyA9ICF2O1xyXG4gICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ2NyeXB0byB1bmF2YWlsYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBDUllQVE8gPSB2O1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyBwICsgJyBub3QgdHJ1ZSBvciBmYWxzZTogJyArIHYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gTU9EVUxPX01PREUge251bWJlcn0gSW50ZWdlciwgMCB0byA5IGluY2x1c2l2ZS5cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBNT0RVTE9fTU9ERSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7dn0nXHJcbiAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHAgPSAnTU9EVUxPX01PREUnKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpbnRDaGVjayh2LCAwLCA5LCBwKTtcclxuICAgICAgICAgICAgTU9EVUxPX01PREUgPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFBPV19QUkVDSVNJT04ge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICAgICAgLy8gJ1tCaWdOdW1iZXIgRXJyb3JdIFBPV19QUkVDSVNJT04ge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ1BPV19QUkVDSVNJT04nKSkge1xyXG4gICAgICAgICAgICB2ID0gb2JqW3BdO1xyXG4gICAgICAgICAgICBpbnRDaGVjayh2LCAwLCBNQVgsIHApO1xyXG4gICAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gdjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBGT1JNQVQge29iamVjdH1cclxuICAgICAgICAgIC8vICdbQmlnTnVtYmVyIEVycm9yXSBGT1JNQVQgbm90IGFuIG9iamVjdDoge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0ZPUk1BVCcpKSB7XHJcbiAgICAgICAgICAgIHYgPSBvYmpbcF07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgRk9STUFUID0gdjtcclxuICAgICAgICAgICAgZWxzZSB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgcCArICcgbm90IGFuIG9iamVjdDogJyArIHYpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEFMUEhBQkVUIHtzdHJpbmd9XHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gQUxQSEFCRVQgaW52YWxpZDoge3Z9J1xyXG4gICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwID0gJ0FMUEhBQkVUJykpIHtcclxuICAgICAgICAgICAgdiA9IG9ialtwXTtcclxuXHJcbiAgICAgICAgICAgIC8vIERpc2FsbG93IGlmIG9ubHkgb25lIGNoYXJhY3RlcixcclxuICAgICAgICAgICAgLy8gb3IgaWYgaXQgY29udGFpbnMgJysnLCAnLScsICcuJywgd2hpdGVzcGFjZSwgb3IgYSByZXBlYXRlZCBjaGFyYWN0ZXIuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdiA9PSAnc3RyaW5nJyAmJiAhL14uJHxbKy0uXFxzXXwoLikuKlxcMS8udGVzdCh2KSkge1xyXG4gICAgICAgICAgICAgIEFMUEhBQkVUID0gdjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyBwICsgJyBpbnZhbGlkOiAnICsgdik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gT2JqZWN0IGV4cGVjdGVkOiB7dn0nXHJcbiAgICAgICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdPYmplY3QgZXhwZWN0ZWQ6ICcgKyBvYmopO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBERUNJTUFMX1BMQUNFUzogREVDSU1BTF9QTEFDRVMsXHJcbiAgICAgICAgUk9VTkRJTkdfTU9ERTogUk9VTkRJTkdfTU9ERSxcclxuICAgICAgICBFWFBPTkVOVElBTF9BVDogW1RPX0VYUF9ORUcsIFRPX0VYUF9QT1NdLFxyXG4gICAgICAgIFJBTkdFOiBbTUlOX0VYUCwgTUFYX0VYUF0sXHJcbiAgICAgICAgQ1JZUFRPOiBDUllQVE8sXHJcbiAgICAgICAgTU9EVUxPX01PREU6IE1PRFVMT19NT0RFLFxyXG4gICAgICAgIFBPV19QUkVDSVNJT046IFBPV19QUkVDSVNJT04sXHJcbiAgICAgICAgRk9STUFUOiBGT1JNQVQsXHJcbiAgICAgICAgQUxQSEFCRVQ6IEFMUEhBQkVUXHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdiBpcyBhIEJpZ051bWJlciBpbnN0YW5jZSwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqXHJcbiAgICAgKiBJZiBCaWdOdW1iZXIuREVCVUcgaXMgdHJ1ZSwgdGhyb3cgaWYgYSBCaWdOdW1iZXIgaW5zdGFuY2UgaXMgbm90IHdlbGwtZm9ybWVkLlxyXG4gICAgICpcclxuICAgICAqIHYge2FueX1cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gSW52YWxpZCBCaWdOdW1iZXI6IHt2fSdcclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLmlzQmlnTnVtYmVyID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgaWYgKCF2IHx8IHYuX2lzQmlnTnVtYmVyICE9PSB0cnVlKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgIGlmICghQmlnTnVtYmVyLkRFQlVHKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgIHZhciBpLCBuLFxyXG4gICAgICAgIGMgPSB2LmMsXHJcbiAgICAgICAgZSA9IHYuZSxcclxuICAgICAgICBzID0gdi5zO1xyXG5cclxuICAgICAgb3V0OiBpZiAoe30udG9TdHJpbmcuY2FsbChjKSA9PSAnW29iamVjdCBBcnJheV0nKSB7XHJcblxyXG4gICAgICAgIGlmICgocyA9PT0gMSB8fCBzID09PSAtMSkgJiYgZSA+PSAtTUFYICYmIGUgPD0gTUFYICYmIGUgPT09IG1hdGhmbG9vcihlKSkge1xyXG5cclxuICAgICAgICAgIC8vIElmIHRoZSBmaXJzdCBlbGVtZW50IGlzIHplcm8sIHRoZSBCaWdOdW1iZXIgdmFsdWUgbXVzdCBiZSB6ZXJvLlxyXG4gICAgICAgICAgaWYgKGNbMF0gPT09IDApIHtcclxuICAgICAgICAgICAgaWYgKGUgPT09IDAgJiYgYy5sZW5ndGggPT09IDEpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICBicmVhayBvdXQ7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIG51bWJlciBvZiBkaWdpdHMgdGhhdCBjWzBdIHNob3VsZCBoYXZlLCBiYXNlZCBvbiB0aGUgZXhwb25lbnQuXHJcbiAgICAgICAgICBpID0gKGUgKyAxKSAlIExPR19CQVNFO1xyXG4gICAgICAgICAgaWYgKGkgPCAxKSBpICs9IExPR19CQVNFO1xyXG5cclxuICAgICAgICAgIC8vIENhbGN1bGF0ZSBudW1iZXIgb2YgZGlnaXRzIG9mIGNbMF0uXHJcbiAgICAgICAgICAvL2lmIChNYXRoLmNlaWwoTWF0aC5sb2coY1swXSArIDEpIC8gTWF0aC5MTjEwKSA9PSBpKSB7XHJcbiAgICAgICAgICBpZiAoU3RyaW5nKGNbMF0pLmxlbmd0aCA9PSBpKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgIG4gPSBjW2ldO1xyXG4gICAgICAgICAgICAgIGlmIChuIDwgMCB8fCBuID49IEJBU0UgfHwgbiAhPT0gbWF0aGZsb29yKG4pKSBicmVhayBvdXQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIExhc3QgZWxlbWVudCBjYW5ub3QgYmUgemVybywgdW5sZXNzIGl0IGlzIHRoZSBvbmx5IGVsZW1lbnQuXHJcbiAgICAgICAgICAgIGlmIChuICE9PSAwKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAvLyBJbmZpbml0eS9OYU5cclxuICAgICAgfSBlbHNlIGlmIChjID09PSBudWxsICYmIGUgPT09IG51bGwgJiYgKHMgPT09IG51bGwgfHwgcyA9PT0gMSB8fCBzID09PSAtMSkpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnSW52YWxpZCBCaWdOdW1iZXI6ICcgKyB2KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBtYXhpbXVtIG9mIHRoZSBhcmd1bWVudHMuXHJcbiAgICAgKlxyXG4gICAgICogYXJndW1lbnRzIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn1cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLm1heGltdW0gPSBCaWdOdW1iZXIubWF4ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gbWF4T3JNaW4oYXJndW1lbnRzLCBQLmx0KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBtaW5pbXVtIG9mIHRoZSBhcmd1bWVudHMuXHJcbiAgICAgKlxyXG4gICAgICogYXJndW1lbnRzIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn1cclxuICAgICAqL1xyXG4gICAgQmlnTnVtYmVyLm1pbmltdW0gPSBCaWdOdW1iZXIubWluID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gbWF4T3JNaW4oYXJndW1lbnRzLCBQLmd0KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdpdGggYSByYW5kb20gdmFsdWUgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIDAgYW5kIGxlc3MgdGhhbiAxLFxyXG4gICAgICogYW5kIHdpdGggZHAsIG9yIERFQ0lNQUxfUExBQ0VTIGlmIGRwIGlzIG9taXR0ZWQsIGRlY2ltYWwgcGxhY2VzIChvciBsZXNzIGlmIHRyYWlsaW5nXHJcbiAgICAgKiB6ZXJvcyBhcmUgcHJvZHVjZWQpLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfSdcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBjcnlwdG8gdW5hdmFpbGFibGUnXHJcbiAgICAgKi9cclxuICAgIEJpZ051bWJlci5yYW5kb20gPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgcG93Ml81MyA9IDB4MjAwMDAwMDAwMDAwMDA7XHJcblxyXG4gICAgICAvLyBSZXR1cm4gYSA1MyBiaXQgaW50ZWdlciBuLCB3aGVyZSAwIDw9IG4gPCA5MDA3MTk5MjU0NzQwOTkyLlxyXG4gICAgICAvLyBDaGVjayBpZiBNYXRoLnJhbmRvbSgpIHByb2R1Y2VzIG1vcmUgdGhhbiAzMiBiaXRzIG9mIHJhbmRvbW5lc3MuXHJcbiAgICAgIC8vIElmIGl0IGRvZXMsIGFzc3VtZSBhdCBsZWFzdCA1MyBiaXRzIGFyZSBwcm9kdWNlZCwgb3RoZXJ3aXNlIGFzc3VtZSBhdCBsZWFzdCAzMCBiaXRzLlxyXG4gICAgICAvLyAweDQwMDAwMDAwIGlzIDJeMzAsIDB4ODAwMDAwIGlzIDJeMjMsIDB4MWZmZmZmIGlzIDJeMjEgLSAxLlxyXG4gICAgICB2YXIgcmFuZG9tNTNiaXRJbnQgPSAoTWF0aC5yYW5kb20oKSAqIHBvdzJfNTMpICYgMHgxZmZmZmZcclxuICAgICAgID8gZnVuY3Rpb24gKCkgeyByZXR1cm4gbWF0aGZsb29yKE1hdGgucmFuZG9tKCkgKiBwb3cyXzUzKTsgfVxyXG4gICAgICAgOiBmdW5jdGlvbiAoKSB7IHJldHVybiAoKE1hdGgucmFuZG9tKCkgKiAweDQwMDAwMDAwIHwgMCkgKiAweDgwMDAwMCkgK1xyXG4gICAgICAgICAoTWF0aC5yYW5kb20oKSAqIDB4ODAwMDAwIHwgMCk7IH07XHJcblxyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGRwKSB7XHJcbiAgICAgICAgdmFyIGEsIGIsIGUsIGssIHYsXHJcbiAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgIGMgPSBbXSxcclxuICAgICAgICAgIHJhbmQgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcblxyXG4gICAgICAgIGlmIChkcCA9PSBudWxsKSBkcCA9IERFQ0lNQUxfUExBQ0VTO1xyXG4gICAgICAgIGVsc2UgaW50Q2hlY2soZHAsIDAsIE1BWCk7XHJcblxyXG4gICAgICAgIGsgPSBtYXRoY2VpbChkcCAvIExPR19CQVNFKTtcclxuXHJcbiAgICAgICAgaWYgKENSWVBUTykge1xyXG5cclxuICAgICAgICAgIC8vIEJyb3dzZXJzIHN1cHBvcnRpbmcgY3J5cHRvLmdldFJhbmRvbVZhbHVlcy5cclxuICAgICAgICAgIGlmIChjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XHJcblxyXG4gICAgICAgICAgICBhID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDMyQXJyYXkoayAqPSAyKSk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgaSA8IGs7KSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIDUzIGJpdHM6XHJcbiAgICAgICAgICAgICAgLy8gKChNYXRoLnBvdygyLCAzMikgLSAxKSAqIE1hdGgucG93KDIsIDIxKSkudG9TdHJpbmcoMilcclxuICAgICAgICAgICAgICAvLyAxMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTEwMDAwMCAwMDAwMDAwMCAwMDAwMDAwMFxyXG4gICAgICAgICAgICAgIC8vICgoTWF0aC5wb3coMiwgMzIpIC0gMSkgPj4+IDExKS50b1N0cmluZygyKVxyXG4gICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDExMTExIDExMTExMTExIDExMTExMTExXHJcbiAgICAgICAgICAgICAgLy8gMHgyMDAwMCBpcyAyXjIxLlxyXG4gICAgICAgICAgICAgIHYgPSBhW2ldICogMHgyMDAwMCArIChhW2kgKyAxXSA+Pj4gMTEpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBSZWplY3Rpb24gc2FtcGxpbmc6XHJcbiAgICAgICAgICAgICAgLy8gMCA8PSB2IDwgOTAwNzE5OTI1NDc0MDk5MlxyXG4gICAgICAgICAgICAgIC8vIFByb2JhYmlsaXR5IHRoYXQgdiA+PSA5ZTE1LCBpc1xyXG4gICAgICAgICAgICAgIC8vIDcxOTkyNTQ3NDA5OTIgLyA5MDA3MTk5MjU0NzQwOTkyIH49IDAuMDAwOCwgaS5lLiAxIGluIDEyNTFcclxuICAgICAgICAgICAgICBpZiAodiA+PSA5ZTE1KSB7XHJcbiAgICAgICAgICAgICAgICBiID0gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDMyQXJyYXkoMikpO1xyXG4gICAgICAgICAgICAgICAgYVtpXSA9IGJbMF07XHJcbiAgICAgICAgICAgICAgICBhW2kgKyAxXSA9IGJbMV07XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyAwIDw9IHYgPD0gODk5OTk5OTk5OTk5OTk5OVxyXG4gICAgICAgICAgICAgICAgLy8gMCA8PSAodiAlIDFlMTQpIDw9IDk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICBjLnB1c2godiAlIDFlMTQpO1xyXG4gICAgICAgICAgICAgICAgaSArPSAyO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpID0gayAvIDI7XHJcblxyXG4gICAgICAgICAgLy8gTm9kZS5qcyBzdXBwb3J0aW5nIGNyeXB0by5yYW5kb21CeXRlcy5cclxuICAgICAgICAgIH0gZWxzZSBpZiAoY3J5cHRvLnJhbmRvbUJ5dGVzKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBidWZmZXJcclxuICAgICAgICAgICAgYSA9IGNyeXB0by5yYW5kb21CeXRlcyhrICo9IDcpO1xyXG5cclxuICAgICAgICAgICAgZm9yICg7IGkgPCBrOykge1xyXG5cclxuICAgICAgICAgICAgICAvLyAweDEwMDAwMDAwMDAwMDAgaXMgMl40OCwgMHgxMDAwMDAwMDAwMCBpcyAyXjQwXHJcbiAgICAgICAgICAgICAgLy8gMHgxMDAwMDAwMDAgaXMgMl4zMiwgMHgxMDAwMDAwIGlzIDJeMjRcclxuICAgICAgICAgICAgICAvLyAxMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMSAxMTExMTExMVxyXG4gICAgICAgICAgICAgIC8vIDAgPD0gdiA8IDkwMDcxOTkyNTQ3NDA5OTJcclxuICAgICAgICAgICAgICB2ID0gKChhW2ldICYgMzEpICogMHgxMDAwMDAwMDAwMDAwKSArIChhW2kgKyAxXSAqIDB4MTAwMDAwMDAwMDApICtcclxuICAgICAgICAgICAgICAgICAoYVtpICsgMl0gKiAweDEwMDAwMDAwMCkgKyAoYVtpICsgM10gKiAweDEwMDAwMDApICtcclxuICAgICAgICAgICAgICAgICAoYVtpICsgNF0gPDwgMTYpICsgKGFbaSArIDVdIDw8IDgpICsgYVtpICsgNl07XHJcblxyXG4gICAgICAgICAgICAgIGlmICh2ID49IDllMTUpIHtcclxuICAgICAgICAgICAgICAgIGNyeXB0by5yYW5kb21CeXRlcyg3KS5jb3B5KGEsIGkpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gMCA8PSAodiAlIDFlMTQpIDw9IDk5OTk5OTk5OTk5OTk5XHJcbiAgICAgICAgICAgICAgICBjLnB1c2godiAlIDFlMTQpO1xyXG4gICAgICAgICAgICAgICAgaSArPSA3O1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpID0gayAvIDc7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBDUllQVE8gPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdjcnlwdG8gdW5hdmFpbGFibGUnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFVzZSBNYXRoLnJhbmRvbS5cclxuICAgICAgICBpZiAoIUNSWVBUTykge1xyXG5cclxuICAgICAgICAgIGZvciAoOyBpIDwgazspIHtcclxuICAgICAgICAgICAgdiA9IHJhbmRvbTUzYml0SW50KCk7XHJcbiAgICAgICAgICAgIGlmICh2IDwgOWUxNSkgY1tpKytdID0gdiAlIDFlMTQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBrID0gY1stLWldO1xyXG4gICAgICAgIGRwICU9IExPR19CQVNFO1xyXG5cclxuICAgICAgICAvLyBDb252ZXJ0IHRyYWlsaW5nIGRpZ2l0cyB0byB6ZXJvcyBhY2NvcmRpbmcgdG8gZHAuXHJcbiAgICAgICAgaWYgKGsgJiYgZHApIHtcclxuICAgICAgICAgIHYgPSBQT1dTX1RFTltMT0dfQkFTRSAtIGRwXTtcclxuICAgICAgICAgIGNbaV0gPSBtYXRoZmxvb3IoayAvIHYpICogdjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyBlbGVtZW50cyB3aGljaCBhcmUgemVyby5cclxuICAgICAgICBmb3IgKDsgY1tpXSA9PT0gMDsgYy5wb3AoKSwgaS0tKTtcclxuXHJcbiAgICAgICAgLy8gWmVybz9cclxuICAgICAgICBpZiAoaSA8IDApIHtcclxuICAgICAgICAgIGMgPSBbZSA9IDBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIGxlYWRpbmcgZWxlbWVudHMgd2hpY2ggYXJlIHplcm8gYW5kIGFkanVzdCBleHBvbmVudCBhY2NvcmRpbmdseS5cclxuICAgICAgICAgIGZvciAoZSA9IC0xIDsgY1swXSA9PT0gMDsgYy5zcGxpY2UoMCwgMSksIGUgLT0gTE9HX0JBU0UpO1xyXG5cclxuICAgICAgICAgIC8vIENvdW50IHRoZSBkaWdpdHMgb2YgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYyB0byBkZXRlcm1pbmUgbGVhZGluZyB6ZXJvcywgYW5kLi4uXHJcbiAgICAgICAgICBmb3IgKGkgPSAxLCB2ID0gY1swXTsgdiA+PSAxMDsgdiAvPSAxMCwgaSsrKTtcclxuXHJcbiAgICAgICAgICAvLyBhZGp1c3QgdGhlIGV4cG9uZW50IGFjY29yZGluZ2x5LlxyXG4gICAgICAgICAgaWYgKGkgPCBMT0dfQkFTRSkgZSAtPSBMT0dfQkFTRSAtIGk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByYW5kLmUgPSBlO1xyXG4gICAgICAgIHJhbmQuYyA9IGM7XHJcbiAgICAgICAgcmV0dXJuIHJhbmQ7XHJcbiAgICAgIH07XHJcbiAgICB9KSgpO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSBzdW0gb2YgdGhlIGFyZ3VtZW50cy5cclxuICAgICAqXHJcbiAgICAgKiBhcmd1bWVudHMge251bWJlcnxzdHJpbmd8QmlnTnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBCaWdOdW1iZXIuc3VtID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgaSA9IDEsXHJcbiAgICAgICAgYXJncyA9IGFyZ3VtZW50cyxcclxuICAgICAgICBzdW0gPSBuZXcgQmlnTnVtYmVyKGFyZ3NbMF0pO1xyXG4gICAgICBmb3IgKDsgaSA8IGFyZ3MubGVuZ3RoOykgc3VtID0gc3VtLnBsdXMoYXJnc1tpKytdKTtcclxuICAgICAgcmV0dXJuIHN1bTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vIFBSSVZBVEUgRlVOQ1RJT05TXHJcblxyXG5cclxuICAgIC8vIENhbGxlZCBieSBCaWdOdW1iZXIgYW5kIEJpZ051bWJlci5wcm90b3R5cGUudG9TdHJpbmcuXHJcbiAgICBjb252ZXJ0QmFzZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBkZWNpbWFsID0gJzAxMjM0NTY3ODknO1xyXG5cclxuICAgICAgLypcclxuICAgICAgICogQ29udmVydCBzdHJpbmcgb2YgYmFzZUluIHRvIGFuIGFycmF5IG9mIG51bWJlcnMgb2YgYmFzZU91dC5cclxuICAgICAgICogRWcuIHRvQmFzZU91dCgnMjU1JywgMTAsIDE2KSByZXR1cm5zIFsxNSwgMTVdLlxyXG4gICAgICAgKiBFZy4gdG9CYXNlT3V0KCdmZicsIDE2LCAxMCkgcmV0dXJucyBbMiwgNSwgNV0uXHJcbiAgICAgICAqL1xyXG4gICAgICBmdW5jdGlvbiB0b0Jhc2VPdXQoc3RyLCBiYXNlSW4sIGJhc2VPdXQsIGFscGhhYmV0KSB7XHJcbiAgICAgICAgdmFyIGosXHJcbiAgICAgICAgICBhcnIgPSBbMF0sXHJcbiAgICAgICAgICBhcnJMLFxyXG4gICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICBsZW4gPSBzdHIubGVuZ3RoO1xyXG5cclxuICAgICAgICBmb3IgKDsgaSA8IGxlbjspIHtcclxuICAgICAgICAgIGZvciAoYXJyTCA9IGFyci5sZW5ndGg7IGFyckwtLTsgYXJyW2FyckxdICo9IGJhc2VJbik7XHJcblxyXG4gICAgICAgICAgYXJyWzBdICs9IGFscGhhYmV0LmluZGV4T2Yoc3RyLmNoYXJBdChpKyspKTtcclxuXHJcbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgYXJyLmxlbmd0aDsgaisrKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJyW2pdID4gYmFzZU91dCAtIDEpIHtcclxuICAgICAgICAgICAgICBpZiAoYXJyW2ogKyAxXSA9PSBudWxsKSBhcnJbaiArIDFdID0gMDtcclxuICAgICAgICAgICAgICBhcnJbaiArIDFdICs9IGFycltqXSAvIGJhc2VPdXQgfCAwO1xyXG4gICAgICAgICAgICAgIGFycltqXSAlPSBiYXNlT3V0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyLnJldmVyc2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ29udmVydCBhIG51bWVyaWMgc3RyaW5nIG9mIGJhc2VJbiB0byBhIG51bWVyaWMgc3RyaW5nIG9mIGJhc2VPdXQuXHJcbiAgICAgIC8vIElmIHRoZSBjYWxsZXIgaXMgdG9TdHJpbmcsIHdlIGFyZSBjb252ZXJ0aW5nIGZyb20gYmFzZSAxMCB0byBiYXNlT3V0LlxyXG4gICAgICAvLyBJZiB0aGUgY2FsbGVyIGlzIEJpZ051bWJlciwgd2UgYXJlIGNvbnZlcnRpbmcgZnJvbSBiYXNlSW4gdG8gYmFzZSAxMC5cclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdHIsIGJhc2VJbiwgYmFzZU91dCwgc2lnbiwgY2FsbGVySXNUb1N0cmluZykge1xyXG4gICAgICAgIHZhciBhbHBoYWJldCwgZCwgZSwgaywgciwgeCwgeGMsIHksXHJcbiAgICAgICAgICBpID0gc3RyLmluZGV4T2YoJy4nKSxcclxuICAgICAgICAgIGRwID0gREVDSU1BTF9QTEFDRVMsXHJcbiAgICAgICAgICBybSA9IFJPVU5ESU5HX01PREU7XHJcblxyXG4gICAgICAgIC8vIE5vbi1pbnRlZ2VyLlxyXG4gICAgICAgIGlmIChpID49IDApIHtcclxuICAgICAgICAgIGsgPSBQT1dfUFJFQ0lTSU9OO1xyXG5cclxuICAgICAgICAgIC8vIFVubGltaXRlZCBwcmVjaXNpb24uXHJcbiAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gMDtcclxuICAgICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKCcuJywgJycpO1xyXG4gICAgICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoYmFzZUluKTtcclxuICAgICAgICAgIHggPSB5LnBvdyhzdHIubGVuZ3RoIC0gaSk7XHJcbiAgICAgICAgICBQT1dfUFJFQ0lTSU9OID0gaztcclxuXHJcbiAgICAgICAgICAvLyBDb252ZXJ0IHN0ciBhcyBpZiBhbiBpbnRlZ2VyLCB0aGVuIHJlc3RvcmUgdGhlIGZyYWN0aW9uIHBhcnQgYnkgZGl2aWRpbmcgdGhlXHJcbiAgICAgICAgICAvLyByZXN1bHQgYnkgaXRzIGJhc2UgcmFpc2VkIHRvIGEgcG93ZXIuXHJcblxyXG4gICAgICAgICAgeS5jID0gdG9CYXNlT3V0KHRvRml4ZWRQb2ludChjb2VmZlRvU3RyaW5nKHguYyksIHguZSwgJzAnKSxcclxuICAgICAgICAgICAxMCwgYmFzZU91dCwgZGVjaW1hbCk7XHJcbiAgICAgICAgICB5LmUgPSB5LmMubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ29udmVydCB0aGUgbnVtYmVyIGFzIGludGVnZXIuXHJcblxyXG4gICAgICAgIHhjID0gdG9CYXNlT3V0KHN0ciwgYmFzZUluLCBiYXNlT3V0LCBjYWxsZXJJc1RvU3RyaW5nXHJcbiAgICAgICAgID8gKGFscGhhYmV0ID0gQUxQSEFCRVQsIGRlY2ltYWwpXHJcbiAgICAgICAgIDogKGFscGhhYmV0ID0gZGVjaW1hbCwgQUxQSEFCRVQpKTtcclxuXHJcbiAgICAgICAgLy8geGMgbm93IHJlcHJlc2VudHMgc3RyIGFzIGFuIGludGVnZXIgYW5kIGNvbnZlcnRlZCB0byBiYXNlT3V0LiBlIGlzIHRoZSBleHBvbmVudC5cclxuICAgICAgICBlID0gayA9IHhjLmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoOyB4Y1stLWtdID09IDA7IHhjLnBvcCgpKTtcclxuXHJcbiAgICAgICAgLy8gWmVybz9cclxuICAgICAgICBpZiAoIXhjWzBdKSByZXR1cm4gYWxwaGFiZXQuY2hhckF0KDApO1xyXG5cclxuICAgICAgICAvLyBEb2VzIHN0ciByZXByZXNlbnQgYW4gaW50ZWdlcj8gSWYgc28sIG5vIG5lZWQgZm9yIHRoZSBkaXZpc2lvbi5cclxuICAgICAgICBpZiAoaSA8IDApIHtcclxuICAgICAgICAgIC0tZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeC5jID0geGM7XHJcbiAgICAgICAgICB4LmUgPSBlO1xyXG5cclxuICAgICAgICAgIC8vIFRoZSBzaWduIGlzIG5lZWRlZCBmb3IgY29ycmVjdCByb3VuZGluZy5cclxuICAgICAgICAgIHgucyA9IHNpZ247XHJcbiAgICAgICAgICB4ID0gZGl2KHgsIHksIGRwLCBybSwgYmFzZU91dCk7XHJcbiAgICAgICAgICB4YyA9IHguYztcclxuICAgICAgICAgIHIgPSB4LnI7XHJcbiAgICAgICAgICBlID0geC5lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8geGMgbm93IHJlcHJlc2VudHMgc3RyIGNvbnZlcnRlZCB0byBiYXNlT3V0LlxyXG5cclxuICAgICAgICAvLyBUSGUgaW5kZXggb2YgdGhlIHJvdW5kaW5nIGRpZ2l0LlxyXG4gICAgICAgIGQgPSBlICsgZHAgKyAxO1xyXG5cclxuICAgICAgICAvLyBUaGUgcm91bmRpbmcgZGlnaXQ6IHRoZSBkaWdpdCB0byB0aGUgcmlnaHQgb2YgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgaSA9IHhjW2RdO1xyXG5cclxuICAgICAgICAvLyBMb29rIGF0IHRoZSByb3VuZGluZyBkaWdpdHMgYW5kIG1vZGUgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdG8gcm91bmQgdXAuXHJcblxyXG4gICAgICAgIGsgPSBiYXNlT3V0IC8gMjtcclxuICAgICAgICByID0gciB8fCBkIDwgMCB8fCB4Y1tkICsgMV0gIT0gbnVsbDtcclxuXHJcbiAgICAgICAgciA9IHJtIDwgNCA/IChpICE9IG51bGwgfHwgcikgJiYgKHJtID09IDAgfHwgcm0gPT0gKHgucyA8IDAgPyAzIDogMikpXHJcbiAgICAgICAgICAgICAgOiBpID4gayB8fCBpID09IGsgJiYocm0gPT0gNCB8fCByIHx8IHJtID09IDYgJiYgeGNbZCAtIDFdICYgMSB8fFxyXG4gICAgICAgICAgICAgICBybSA9PSAoeC5zIDwgMCA/IDggOiA3KSk7XHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBpbmRleCBvZiB0aGUgcm91bmRpbmcgZGlnaXQgaXMgbm90IGdyZWF0ZXIgdGhhbiB6ZXJvLCBvciB4YyByZXByZXNlbnRzXHJcbiAgICAgICAgLy8gemVybywgdGhlbiB0aGUgcmVzdWx0IG9mIHRoZSBiYXNlIGNvbnZlcnNpb24gaXMgemVybyBvciwgaWYgcm91bmRpbmcgdXAsIGEgdmFsdWVcclxuICAgICAgICAvLyBzdWNoIGFzIDAuMDAwMDEuXHJcbiAgICAgICAgaWYgKGQgPCAxIHx8ICF4Y1swXSkge1xyXG5cclxuICAgICAgICAgIC8vIDFeLWRwIG9yIDBcclxuICAgICAgICAgIHN0ciA9IHIgPyB0b0ZpeGVkUG9pbnQoYWxwaGFiZXQuY2hhckF0KDEpLCAtZHAsIGFscGhhYmV0LmNoYXJBdCgwKSkgOiBhbHBoYWJldC5jaGFyQXQoMCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAvLyBUcnVuY2F0ZSB4YyB0byB0aGUgcmVxdWlyZWQgbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICAgICAgeGMubGVuZ3RoID0gZDtcclxuXHJcbiAgICAgICAgICAvLyBSb3VuZCB1cD9cclxuICAgICAgICAgIGlmIChyKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBSb3VuZGluZyB1cCBtYXkgbWVhbiB0aGUgcHJldmlvdXMgZGlnaXQgaGFzIHRvIGJlIHJvdW5kZWQgdXAgYW5kIHNvIG9uLlxyXG4gICAgICAgICAgICBmb3IgKC0tYmFzZU91dDsgKyt4Y1stLWRdID4gYmFzZU91dDspIHtcclxuICAgICAgICAgICAgICB4Y1tkXSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgIGlmICghZCkge1xyXG4gICAgICAgICAgICAgICAgKytlO1xyXG4gICAgICAgICAgICAgICAgeGMgPSBbMV0uY29uY2F0KHhjKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBEZXRlcm1pbmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICBmb3IgKGsgPSB4Yy5sZW5ndGg7ICF4Y1stLWtdOyk7XHJcblxyXG4gICAgICAgICAgLy8gRS5nLiBbNCwgMTEsIDE1XSBiZWNvbWVzIDRiZi5cclxuICAgICAgICAgIGZvciAoaSA9IDAsIHN0ciA9ICcnOyBpIDw9IGs7IHN0ciArPSBhbHBoYWJldC5jaGFyQXQoeGNbaSsrXSkpO1xyXG5cclxuICAgICAgICAgIC8vIEFkZCBsZWFkaW5nIHplcm9zLCBkZWNpbWFsIHBvaW50IGFuZCB0cmFpbGluZyB6ZXJvcyBhcyByZXF1aXJlZC5cclxuICAgICAgICAgIHN0ciA9IHRvRml4ZWRQb2ludChzdHIsIGUsIGFscGhhYmV0LmNoYXJBdCgwKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUaGUgY2FsbGVyIHdpbGwgYWRkIHRoZSBzaWduLlxyXG4gICAgICAgIHJldHVybiBzdHI7XHJcbiAgICAgIH07XHJcbiAgICB9KSgpO1xyXG5cclxuXHJcbiAgICAvLyBQZXJmb3JtIGRpdmlzaW9uIGluIHRoZSBzcGVjaWZpZWQgYmFzZS4gQ2FsbGVkIGJ5IGRpdiBhbmQgY29udmVydEJhc2UuXHJcbiAgICBkaXYgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgLy8gQXNzdW1lIG5vbi16ZXJvIHggYW5kIGsuXHJcbiAgICAgIGZ1bmN0aW9uIG11bHRpcGx5KHgsIGssIGJhc2UpIHtcclxuICAgICAgICB2YXIgbSwgdGVtcCwgeGxvLCB4aGksXHJcbiAgICAgICAgICBjYXJyeSA9IDAsXHJcbiAgICAgICAgICBpID0geC5sZW5ndGgsXHJcbiAgICAgICAgICBrbG8gPSBrICUgU1FSVF9CQVNFLFxyXG4gICAgICAgICAga2hpID0gayAvIFNRUlRfQkFTRSB8IDA7XHJcblxyXG4gICAgICAgIGZvciAoeCA9IHguc2xpY2UoKTsgaS0tOykge1xyXG4gICAgICAgICAgeGxvID0geFtpXSAlIFNRUlRfQkFTRTtcclxuICAgICAgICAgIHhoaSA9IHhbaV0gLyBTUVJUX0JBU0UgfCAwO1xyXG4gICAgICAgICAgbSA9IGtoaSAqIHhsbyArIHhoaSAqIGtsbztcclxuICAgICAgICAgIHRlbXAgPSBrbG8gKiB4bG8gKyAoKG0gJSBTUVJUX0JBU0UpICogU1FSVF9CQVNFKSArIGNhcnJ5O1xyXG4gICAgICAgICAgY2FycnkgPSAodGVtcCAvIGJhc2UgfCAwKSArIChtIC8gU1FSVF9CQVNFIHwgMCkgKyBraGkgKiB4aGk7XHJcbiAgICAgICAgICB4W2ldID0gdGVtcCAlIGJhc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY2FycnkpIHggPSBbY2FycnldLmNvbmNhdCh4KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGNvbXBhcmUoYSwgYiwgYUwsIGJMKSB7XHJcbiAgICAgICAgdmFyIGksIGNtcDtcclxuXHJcbiAgICAgICAgaWYgKGFMICE9IGJMKSB7XHJcbiAgICAgICAgICBjbXAgPSBhTCA+IGJMID8gMSA6IC0xO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgZm9yIChpID0gY21wID0gMDsgaSA8IGFMOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChhW2ldICE9IGJbaV0pIHtcclxuICAgICAgICAgICAgICBjbXAgPSBhW2ldID4gYltpXSA/IDEgOiAtMTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNtcDtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gc3VidHJhY3QoYSwgYiwgYUwsIGJhc2UpIHtcclxuICAgICAgICB2YXIgaSA9IDA7XHJcblxyXG4gICAgICAgIC8vIFN1YnRyYWN0IGIgZnJvbSBhLlxyXG4gICAgICAgIGZvciAoOyBhTC0tOykge1xyXG4gICAgICAgICAgYVthTF0gLT0gaTtcclxuICAgICAgICAgIGkgPSBhW2FMXSA8IGJbYUxdID8gMSA6IDA7XHJcbiAgICAgICAgICBhW2FMXSA9IGkgKiBiYXNlICsgYVthTF0gLSBiW2FMXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoOyAhYVswXSAmJiBhLmxlbmd0aCA+IDE7IGEuc3BsaWNlKDAsIDEpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8geDogZGl2aWRlbmQsIHk6IGRpdmlzb3IuXHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoeCwgeSwgZHAsIHJtLCBiYXNlKSB7XHJcbiAgICAgICAgdmFyIGNtcCwgZSwgaSwgbW9yZSwgbiwgcHJvZCwgcHJvZEwsIHEsIHFjLCByZW0sIHJlbUwsIHJlbTAsIHhpLCB4TCwgeWMwLFxyXG4gICAgICAgICAgeUwsIHl6LFxyXG4gICAgICAgICAgcyA9IHgucyA9PSB5LnMgPyAxIDogLTEsXHJcbiAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgIHljID0geS5jO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgTmFOLCBJbmZpbml0eSBvciAwP1xyXG4gICAgICAgIGlmICgheGMgfHwgIXhjWzBdIHx8ICF5YyB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcihcclxuXHJcbiAgICAgICAgICAgLy8gUmV0dXJuIE5hTiBpZiBlaXRoZXIgTmFOLCBvciBib3RoIEluZmluaXR5IG9yIDAuXHJcbiAgICAgICAgICAgIXgucyB8fCAheS5zIHx8ICh4YyA/IHljICYmIHhjWzBdID09IHljWzBdIDogIXljKSA/IE5hTiA6XHJcblxyXG4gICAgICAgICAgICAvLyBSZXR1cm4gwrEwIGlmIHggaXMgwrEwIG9yIHkgaXMgwrFJbmZpbml0eSwgb3IgcmV0dXJuIMKxSW5maW5pdHkgYXMgeSBpcyDCsTAuXHJcbiAgICAgICAgICAgIHhjICYmIHhjWzBdID09IDAgfHwgIXljID8gcyAqIDAgOiBzIC8gMFxyXG4gICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcSA9IG5ldyBCaWdOdW1iZXIocyk7XHJcbiAgICAgICAgcWMgPSBxLmMgPSBbXTtcclxuICAgICAgICBlID0geC5lIC0geS5lO1xyXG4gICAgICAgIHMgPSBkcCArIGUgKyAxO1xyXG5cclxuICAgICAgICBpZiAoIWJhc2UpIHtcclxuICAgICAgICAgIGJhc2UgPSBCQVNFO1xyXG4gICAgICAgICAgZSA9IGJpdEZsb29yKHguZSAvIExPR19CQVNFKSAtIGJpdEZsb29yKHkuZSAvIExPR19CQVNFKTtcclxuICAgICAgICAgIHMgPSBzIC8gTE9HX0JBU0UgfCAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVzdWx0IGV4cG9uZW50IG1heSBiZSBvbmUgbGVzcyB0aGVuIHRoZSBjdXJyZW50IHZhbHVlIG9mIGUuXHJcbiAgICAgICAgLy8gVGhlIGNvZWZmaWNpZW50cyBvZiB0aGUgQmlnTnVtYmVycyBmcm9tIGNvbnZlcnRCYXNlIG1heSBoYXZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgIGZvciAoaSA9IDA7IHljW2ldID09ICh4Y1tpXSB8fCAwKTsgaSsrKTtcclxuXHJcbiAgICAgICAgaWYgKHljW2ldID4gKHhjW2ldIHx8IDApKSBlLS07XHJcblxyXG4gICAgICAgIGlmIChzIDwgMCkge1xyXG4gICAgICAgICAgcWMucHVzaCgxKTtcclxuICAgICAgICAgIG1vcmUgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB4TCA9IHhjLmxlbmd0aDtcclxuICAgICAgICAgIHlMID0geWMubGVuZ3RoO1xyXG4gICAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgICBzICs9IDI7XHJcblxyXG4gICAgICAgICAgLy8gTm9ybWFsaXNlIHhjIGFuZCB5YyBzbyBoaWdoZXN0IG9yZGVyIGRpZ2l0IG9mIHljIGlzID49IGJhc2UgLyAyLlxyXG5cclxuICAgICAgICAgIG4gPSBtYXRoZmxvb3IoYmFzZSAvICh5Y1swXSArIDEpKTtcclxuXHJcbiAgICAgICAgICAvLyBOb3QgbmVjZXNzYXJ5LCBidXQgdG8gaGFuZGxlIG9kZCBiYXNlcyB3aGVyZSB5Y1swXSA9PSAoYmFzZSAvIDIpIC0gMS5cclxuICAgICAgICAgIC8vIGlmIChuID4gMSB8fCBuKysgPT0gMSAmJiB5Y1swXSA8IGJhc2UgLyAyKSB7XHJcbiAgICAgICAgICBpZiAobiA+IDEpIHtcclxuICAgICAgICAgICAgeWMgPSBtdWx0aXBseSh5YywgbiwgYmFzZSk7XHJcbiAgICAgICAgICAgIHhjID0gbXVsdGlwbHkoeGMsIG4sIGJhc2UpO1xyXG4gICAgICAgICAgICB5TCA9IHljLmxlbmd0aDtcclxuICAgICAgICAgICAgeEwgPSB4Yy5sZW5ndGg7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgeGkgPSB5TDtcclxuICAgICAgICAgIHJlbSA9IHhjLnNsaWNlKDAsIHlMKTtcclxuICAgICAgICAgIHJlbUwgPSByZW0ubGVuZ3RoO1xyXG5cclxuICAgICAgICAgIC8vIEFkZCB6ZXJvcyB0byBtYWtlIHJlbWFpbmRlciBhcyBsb25nIGFzIGRpdmlzb3IuXHJcbiAgICAgICAgICBmb3IgKDsgcmVtTCA8IHlMOyByZW1bcmVtTCsrXSA9IDApO1xyXG4gICAgICAgICAgeXogPSB5Yy5zbGljZSgpO1xyXG4gICAgICAgICAgeXogPSBbMF0uY29uY2F0KHl6KTtcclxuICAgICAgICAgIHljMCA9IHljWzBdO1xyXG4gICAgICAgICAgaWYgKHljWzFdID49IGJhc2UgLyAyKSB5YzArKztcclxuICAgICAgICAgIC8vIE5vdCBuZWNlc3NhcnksIGJ1dCB0byBwcmV2ZW50IHRyaWFsIGRpZ2l0IG4gPiBiYXNlLCB3aGVuIHVzaW5nIGJhc2UgMy5cclxuICAgICAgICAgIC8vIGVsc2UgaWYgKGJhc2UgPT0gMyAmJiB5YzAgPT0gMSkgeWMwID0gMSArIDFlLTE1O1xyXG5cclxuICAgICAgICAgIGRvIHtcclxuICAgICAgICAgICAgbiA9IDA7XHJcblxyXG4gICAgICAgICAgICAvLyBDb21wYXJlIGRpdmlzb3IgYW5kIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgY21wID0gY29tcGFyZSh5YywgcmVtLCB5TCwgcmVtTCk7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBkaXZpc29yIDwgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICBpZiAoY21wIDwgMCkge1xyXG5cclxuICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgdHJpYWwgZGlnaXQsIG4uXHJcblxyXG4gICAgICAgICAgICAgIHJlbTAgPSByZW1bMF07XHJcbiAgICAgICAgICAgICAgaWYgKHlMICE9IHJlbUwpIHJlbTAgPSByZW0wICogYmFzZSArIChyZW1bMV0gfHwgMCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIG4gaXMgaG93IG1hbnkgdGltZXMgdGhlIGRpdmlzb3IgZ29lcyBpbnRvIHRoZSBjdXJyZW50IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICBuID0gbWF0aGZsb29yKHJlbTAgLyB5YzApO1xyXG5cclxuICAgICAgICAgICAgICAvLyAgQWxnb3JpdGhtOlxyXG4gICAgICAgICAgICAgIC8vICBwcm9kdWN0ID0gZGl2aXNvciBtdWx0aXBsaWVkIGJ5IHRyaWFsIGRpZ2l0IChuKS5cclxuICAgICAgICAgICAgICAvLyAgQ29tcGFyZSBwcm9kdWN0IGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgLy8gIElmIHByb2R1Y3QgaXMgZ3JlYXRlciB0aGFuIHJlbWFpbmRlcjpcclxuICAgICAgICAgICAgICAvLyAgICBTdWJ0cmFjdCBkaXZpc29yIGZyb20gcHJvZHVjdCwgZGVjcmVtZW50IHRyaWFsIGRpZ2l0LlxyXG4gICAgICAgICAgICAgIC8vICBTdWJ0cmFjdCBwcm9kdWN0IGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIC8vICBJZiBwcm9kdWN0IHdhcyBsZXNzIHRoYW4gcmVtYWluZGVyIGF0IHRoZSBsYXN0IGNvbXBhcmU6XHJcbiAgICAgICAgICAgICAgLy8gICAgQ29tcGFyZSBuZXcgcmVtYWluZGVyIGFuZCBkaXZpc29yLlxyXG4gICAgICAgICAgICAgIC8vICAgIElmIHJlbWFpbmRlciBpcyBncmVhdGVyIHRoYW4gZGl2aXNvcjpcclxuICAgICAgICAgICAgICAvLyAgICAgIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIsIGluY3JlbWVudCB0cmlhbCBkaWdpdC5cclxuXHJcbiAgICAgICAgICAgICAgaWYgKG4gPiAxKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbiBtYXkgYmUgPiBiYXNlIG9ubHkgd2hlbiBiYXNlIGlzIDMuXHJcbiAgICAgICAgICAgICAgICBpZiAobiA+PSBiYXNlKSBuID0gYmFzZSAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcHJvZHVjdCA9IGRpdmlzb3IgKiB0cmlhbCBkaWdpdC5cclxuICAgICAgICAgICAgICAgIHByb2QgPSBtdWx0aXBseSh5YywgbiwgYmFzZSk7XHJcbiAgICAgICAgICAgICAgICBwcm9kTCA9IHByb2QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBwcm9kdWN0IGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBwcm9kdWN0ID4gcmVtYWluZGVyIHRoZW4gdHJpYWwgZGlnaXQgbiB0b28gaGlnaC5cclxuICAgICAgICAgICAgICAgIC8vIG4gaXMgMSB0b28gaGlnaCBhYm91dCA1JSBvZiB0aGUgdGltZSwgYW5kIGlzIG5vdCBrbm93biB0byBoYXZlXHJcbiAgICAgICAgICAgICAgICAvLyBldmVyIGJlZW4gbW9yZSB0aGFuIDEgdG9vIGhpZ2guXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoY29tcGFyZShwcm9kLCByZW0sIHByb2RMLCByZW1MKSA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIG4tLTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIFN1YnRyYWN0IGRpdmlzb3IgZnJvbSBwcm9kdWN0LlxyXG4gICAgICAgICAgICAgICAgICBzdWJ0cmFjdChwcm9kLCB5TCA8IHByb2RMID8geXogOiB5YywgcHJvZEwsIGJhc2UpO1xyXG4gICAgICAgICAgICAgICAgICBwcm9kTCA9IHByb2QubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICBjbXAgPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbiBpcyAwIG9yIDEsIGNtcCBpcyAtMS5cclxuICAgICAgICAgICAgICAgIC8vIElmIG4gaXMgMCwgdGhlcmUgaXMgbm8gbmVlZCB0byBjb21wYXJlIHljIGFuZCByZW0gYWdhaW4gYmVsb3csXHJcbiAgICAgICAgICAgICAgICAvLyBzbyBjaGFuZ2UgY21wIHRvIDEgdG8gYXZvaWQgaXQuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBuIGlzIDEsIGxlYXZlIGNtcCBhcyAtMSwgc28geWMgYW5kIHJlbSBhcmUgY29tcGFyZWQgYWdhaW4uXHJcbiAgICAgICAgICAgICAgICBpZiAobiA9PSAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBkaXZpc29yIDwgcmVtYWluZGVyLCBzbyBuIG11c3QgYmUgYXQgbGVhc3QgMS5cclxuICAgICAgICAgICAgICAgICAgY21wID0gbiA9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcHJvZHVjdCA9IGRpdmlzb3JcclxuICAgICAgICAgICAgICAgIHByb2QgPSB5Yy5zbGljZSgpO1xyXG4gICAgICAgICAgICAgICAgcHJvZEwgPSBwcm9kLmxlbmd0aDtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChwcm9kTCA8IHJlbUwpIHByb2QgPSBbMF0uY29uY2F0KHByb2QpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBTdWJ0cmFjdCBwcm9kdWN0IGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgIHN1YnRyYWN0KHJlbSwgcHJvZCwgcmVtTCwgYmFzZSk7XHJcbiAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAvLyBJZiBwcm9kdWN0IHdhcyA8IHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICBpZiAoY21wID09IC0xKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBkaXZpc29yIGFuZCBuZXcgcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgLy8gSWYgZGl2aXNvciA8IG5ldyByZW1haW5kZXIsIHN1YnRyYWN0IGRpdmlzb3IgZnJvbSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICAvLyBUcmlhbCBkaWdpdCBuIHRvbyBsb3cuXHJcbiAgICAgICAgICAgICAgICAvLyBuIGlzIDEgdG9vIGxvdyBhYm91dCA1JSBvZiB0aGUgdGltZSwgYW5kIHZlcnkgcmFyZWx5IDIgdG9vIGxvdy5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChjb21wYXJlKHljLCByZW0sIHlMLCByZW1MKSA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgbisrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gU3VidHJhY3QgZGl2aXNvciBmcm9tIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgICAgICAgc3VidHJhY3QocmVtLCB5TCA8IHJlbUwgPyB5eiA6IHljLCByZW1MLCBiYXNlKTtcclxuICAgICAgICAgICAgICAgICAgcmVtTCA9IHJlbS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNtcCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIG4rKztcclxuICAgICAgICAgICAgICByZW0gPSBbMF07XHJcbiAgICAgICAgICAgIH0gLy8gZWxzZSBjbXAgPT09IDEgYW5kIG4gd2lsbCBiZSAwXHJcblxyXG4gICAgICAgICAgICAvLyBBZGQgdGhlIG5leHQgZGlnaXQsIG4sIHRvIHRoZSByZXN1bHQgYXJyYXkuXHJcbiAgICAgICAgICAgIHFjW2krK10gPSBuO1xyXG5cclxuICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSByZW1haW5kZXIuXHJcbiAgICAgICAgICAgIGlmIChyZW1bMF0pIHtcclxuICAgICAgICAgICAgICByZW1bcmVtTCsrXSA9IHhjW3hpXSB8fCAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHJlbSA9IFt4Y1t4aV1dO1xyXG4gICAgICAgICAgICAgIHJlbUwgPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IHdoaWxlICgoeGkrKyA8IHhMIHx8IHJlbVswXSAhPSBudWxsKSAmJiBzLS0pO1xyXG5cclxuICAgICAgICAgIG1vcmUgPSByZW1bMF0gIT0gbnVsbDtcclxuXHJcbiAgICAgICAgICAvLyBMZWFkaW5nIHplcm8/XHJcbiAgICAgICAgICBpZiAoIXFjWzBdKSBxYy5zcGxpY2UoMCwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYmFzZSA9PSBCQVNFKSB7XHJcblxyXG4gICAgICAgICAgLy8gVG8gY2FsY3VsYXRlIHEuZSwgZmlyc3QgZ2V0IHRoZSBudW1iZXIgb2YgZGlnaXRzIG9mIHFjWzBdLlxyXG4gICAgICAgICAgZm9yIChpID0gMSwgcyA9IHFjWzBdOyBzID49IDEwOyBzIC89IDEwLCBpKyspO1xyXG5cclxuICAgICAgICAgIHJvdW5kKHEsIGRwICsgKHEuZSA9IGkgKyBlICogTE9HX0JBU0UgLSAxKSArIDEsIHJtLCBtb3JlKTtcclxuXHJcbiAgICAgICAgLy8gQ2FsbGVyIGlzIGNvbnZlcnRCYXNlLlxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBxLmUgPSBlO1xyXG4gICAgICAgICAgcS5yID0gK21vcmU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcTtcclxuICAgICAgfTtcclxuICAgIH0pKCk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIgbiBpbiBmaXhlZC1wb2ludCBvciBleHBvbmVudGlhbFxyXG4gICAgICogbm90YXRpb24gcm91bmRlZCB0byB0aGUgc3BlY2lmaWVkIGRlY2ltYWwgcGxhY2VzIG9yIHNpZ25pZmljYW50IGRpZ2l0cy5cclxuICAgICAqXHJcbiAgICAgKiBuOiBhIEJpZ051bWJlci5cclxuICAgICAqIGk6IHRoZSBpbmRleCBvZiB0aGUgbGFzdCBkaWdpdCByZXF1aXJlZCAoaS5lLiB0aGUgZGlnaXQgdGhhdCBtYXkgYmUgcm91bmRlZCB1cCkuXHJcbiAgICAgKiBybTogdGhlIHJvdW5kaW5nIG1vZGUuXHJcbiAgICAgKiBpZDogMSAodG9FeHBvbmVudGlhbCkgb3IgMiAodG9QcmVjaXNpb24pLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBmb3JtYXQobiwgaSwgcm0sIGlkKSB7XHJcbiAgICAgIHZhciBjMCwgZSwgbmUsIGxlbiwgc3RyO1xyXG5cclxuICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcblxyXG4gICAgICBpZiAoIW4uYykgcmV0dXJuIG4udG9TdHJpbmcoKTtcclxuXHJcbiAgICAgIGMwID0gbi5jWzBdO1xyXG4gICAgICBuZSA9IG4uZTtcclxuXHJcbiAgICAgIGlmIChpID09IG51bGwpIHtcclxuICAgICAgICBzdHIgPSBjb2VmZlRvU3RyaW5nKG4uYyk7XHJcbiAgICAgICAgc3RyID0gaWQgPT0gMSB8fCBpZCA9PSAyICYmIChuZSA8PSBUT19FWFBfTkVHIHx8IG5lID49IFRPX0VYUF9QT1MpXHJcbiAgICAgICAgID8gdG9FeHBvbmVudGlhbChzdHIsIG5lKVxyXG4gICAgICAgICA6IHRvRml4ZWRQb2ludChzdHIsIG5lLCAnMCcpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG4gPSByb3VuZChuZXcgQmlnTnVtYmVyKG4pLCBpLCBybSk7XHJcblxyXG4gICAgICAgIC8vIG4uZSBtYXkgaGF2ZSBjaGFuZ2VkIGlmIHRoZSB2YWx1ZSB3YXMgcm91bmRlZCB1cC5cclxuICAgICAgICBlID0gbi5lO1xyXG5cclxuICAgICAgICBzdHIgPSBjb2VmZlRvU3RyaW5nKG4uYyk7XHJcbiAgICAgICAgbGVuID0gc3RyLmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gdG9QcmVjaXNpb24gcmV0dXJucyBleHBvbmVudGlhbCBub3RhdGlvbiBpZiB0aGUgbnVtYmVyIG9mIHNpZ25pZmljYW50IGRpZ2l0c1xyXG4gICAgICAgIC8vIHNwZWNpZmllZCBpcyBsZXNzIHRoYW4gdGhlIG51bWJlciBvZiBkaWdpdHMgbmVjZXNzYXJ5IHRvIHJlcHJlc2VudCB0aGUgaW50ZWdlclxyXG4gICAgICAgIC8vIHBhcnQgb2YgdGhlIHZhbHVlIGluIGZpeGVkLXBvaW50IG5vdGF0aW9uLlxyXG5cclxuICAgICAgICAvLyBFeHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgICBpZiAoaWQgPT0gMSB8fCBpZCA9PSAyICYmIChpIDw9IGUgfHwgZSA8PSBUT19FWFBfTkVHKSkge1xyXG5cclxuICAgICAgICAgIC8vIEFwcGVuZCB6ZXJvcz9cclxuICAgICAgICAgIGZvciAoOyBsZW4gPCBpOyBzdHIgKz0gJzAnLCBsZW4rKyk7XHJcbiAgICAgICAgICBzdHIgPSB0b0V4cG9uZW50aWFsKHN0ciwgZSk7XHJcblxyXG4gICAgICAgIC8vIEZpeGVkLXBvaW50IG5vdGF0aW9uLlxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpIC09IG5lO1xyXG4gICAgICAgICAgc3RyID0gdG9GaXhlZFBvaW50KHN0ciwgZSwgJzAnKTtcclxuXHJcbiAgICAgICAgICAvLyBBcHBlbmQgemVyb3M/XHJcbiAgICAgICAgICBpZiAoZSArIDEgPiBsZW4pIHtcclxuICAgICAgICAgICAgaWYgKC0taSA+IDApIGZvciAoc3RyICs9ICcuJzsgaS0tOyBzdHIgKz0gJzAnKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGkgKz0gZSAtIGxlbjtcclxuICAgICAgICAgICAgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgaWYgKGUgKyAxID09IGxlbikgc3RyICs9ICcuJztcclxuICAgICAgICAgICAgICBmb3IgKDsgaS0tOyBzdHIgKz0gJzAnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG4ucyA8IDAgJiYgYzAgPyAnLScgKyBzdHIgOiBzdHI7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIEhhbmRsZSBCaWdOdW1iZXIubWF4IGFuZCBCaWdOdW1iZXIubWluLlxyXG4gICAgZnVuY3Rpb24gbWF4T3JNaW4oYXJncywgbWV0aG9kKSB7XHJcbiAgICAgIHZhciBuLFxyXG4gICAgICAgIGkgPSAxLFxyXG4gICAgICAgIG0gPSBuZXcgQmlnTnVtYmVyKGFyZ3NbMF0pO1xyXG5cclxuICAgICAgZm9yICg7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgbiA9IG5ldyBCaWdOdW1iZXIoYXJnc1tpXSk7XHJcblxyXG4gICAgICAgIC8vIElmIGFueSBudW1iZXIgaXMgTmFOLCByZXR1cm4gTmFOLlxyXG4gICAgICAgIGlmICghbi5zKSB7XHJcbiAgICAgICAgICBtID0gbjtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobWV0aG9kLmNhbGwobSwgbikpIHtcclxuICAgICAgICAgIG0gPSBuO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG07XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBTdHJpcCB0cmFpbGluZyB6ZXJvcywgY2FsY3VsYXRlIGJhc2UgMTAgZXhwb25lbnQgYW5kIGNoZWNrIGFnYWluc3QgTUlOX0VYUCBhbmQgTUFYX0VYUC5cclxuICAgICAqIENhbGxlZCBieSBtaW51cywgcGx1cyBhbmQgdGltZXMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG5vcm1hbGlzZShuLCBjLCBlKSB7XHJcbiAgICAgIHZhciBpID0gMSxcclxuICAgICAgICBqID0gYy5sZW5ndGg7XHJcblxyXG4gICAgICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICBmb3IgKDsgIWNbLS1qXTsgYy5wb3AoKSk7XHJcblxyXG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIGJhc2UgMTAgZXhwb25lbnQuIEZpcnN0IGdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiBjWzBdLlxyXG4gICAgICBmb3IgKGogPSBjWzBdOyBqID49IDEwOyBqIC89IDEwLCBpKyspO1xyXG5cclxuICAgICAgLy8gT3ZlcmZsb3c/XHJcbiAgICAgIGlmICgoZSA9IGkgKyBlICogTE9HX0JBU0UgLSAxKSA+IE1BWF9FWFApIHtcclxuXHJcbiAgICAgICAgLy8gSW5maW5pdHkuXHJcbiAgICAgICAgbi5jID0gbi5lID0gbnVsbDtcclxuXHJcbiAgICAgIC8vIFVuZGVyZmxvdz9cclxuICAgICAgfSBlbHNlIGlmIChlIDwgTUlOX0VYUCkge1xyXG5cclxuICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgIG4uYyA9IFtuLmUgPSAwXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBuLmUgPSBlO1xyXG4gICAgICAgIG4uYyA9IGM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBuO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBIYW5kbGUgdmFsdWVzIHRoYXQgZmFpbCB0aGUgdmFsaWRpdHkgdGVzdCBpbiBCaWdOdW1iZXIuXHJcbiAgICBwYXJzZU51bWVyaWMgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgYmFzZVByZWZpeCA9IC9eKC0/KTAoW3hib10pKD89XFx3W1xcdy5dKiQpL2ksXHJcbiAgICAgICAgZG90QWZ0ZXIgPSAvXihbXi5dKylcXC4kLyxcclxuICAgICAgICBkb3RCZWZvcmUgPSAvXlxcLihbXi5dKykkLyxcclxuICAgICAgICBpc0luZmluaXR5T3JOYU4gPSAvXi0/KEluZmluaXR5fE5hTikkLyxcclxuICAgICAgICB3aGl0ZXNwYWNlT3JQbHVzID0gL15cXHMqXFwrKD89W1xcdy5dKXxeXFxzK3xcXHMrJC9nO1xyXG5cclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICh4LCBzdHIsIGlzTnVtLCBiKSB7XHJcbiAgICAgICAgdmFyIGJhc2UsXHJcbiAgICAgICAgICBzID0gaXNOdW0gPyBzdHIgOiBzdHIucmVwbGFjZSh3aGl0ZXNwYWNlT3JQbHVzLCAnJyk7XHJcblxyXG4gICAgICAgIC8vIE5vIGV4Y2VwdGlvbiBvbiDCsUluZmluaXR5IG9yIE5hTi5cclxuICAgICAgICBpZiAoaXNJbmZpbml0eU9yTmFOLnRlc3QocykpIHtcclxuICAgICAgICAgIHgucyA9IGlzTmFOKHMpID8gbnVsbCA6IHMgPCAwID8gLTEgOiAxO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAoIWlzTnVtKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBiYXNlUHJlZml4ID0gL14oLT8pMChbeGJvXSkoPz1cXHdbXFx3Ll0qJCkvaVxyXG4gICAgICAgICAgICBzID0gcy5yZXBsYWNlKGJhc2VQcmVmaXgsIGZ1bmN0aW9uIChtLCBwMSwgcDIpIHtcclxuICAgICAgICAgICAgICBiYXNlID0gKHAyID0gcDIudG9Mb3dlckNhc2UoKSkgPT0gJ3gnID8gMTYgOiBwMiA9PSAnYicgPyAyIDogODtcclxuICAgICAgICAgICAgICByZXR1cm4gIWIgfHwgYiA9PSBiYXNlID8gcDEgOiBtO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChiKSB7XHJcbiAgICAgICAgICAgICAgYmFzZSA9IGI7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEUuZy4gJzEuJyB0byAnMScsICcuMScgdG8gJzAuMSdcclxuICAgICAgICAgICAgICBzID0gcy5yZXBsYWNlKGRvdEFmdGVyLCAnJDEnKS5yZXBsYWNlKGRvdEJlZm9yZSwgJzAuJDEnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHN0ciAhPSBzKSByZXR1cm4gbmV3IEJpZ051bWJlcihzLCBiYXNlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gTm90IGEgbnVtYmVyOiB7bn0nXHJcbiAgICAgICAgICAvLyAnW0JpZ051bWJlciBFcnJvcl0gTm90IGEgYmFzZSB7Yn0gbnVtYmVyOiB7bn0nXHJcbiAgICAgICAgICBpZiAoQmlnTnVtYmVyLkRFQlVHKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgICAgKGJpZ251bWJlckVycm9yICsgJ05vdCBhJyArIChiID8gJyBiYXNlICcgKyBiIDogJycpICsgJyBudW1iZXI6ICcgKyBzdHIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIE5hTlxyXG4gICAgICAgICAgeC5zID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHguYyA9IHguZSA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgIH0pKCk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSb3VuZCB4IHRvIHNkIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyByb3VuZGluZyBtb2RlIHJtLiBDaGVjayBmb3Igb3Zlci91bmRlci1mbG93LlxyXG4gICAgICogSWYgciBpcyB0cnV0aHksIGl0IGlzIGtub3duIHRoYXQgdGhlcmUgYXJlIG1vcmUgZGlnaXRzIGFmdGVyIHRoZSByb3VuZGluZyBkaWdpdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcm91bmQoeCwgc2QsIHJtLCByKSB7XHJcbiAgICAgIHZhciBkLCBpLCBqLCBrLCBuLCBuaSwgcmQsXHJcbiAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgcG93czEwID0gUE9XU19URU47XHJcblxyXG4gICAgICAvLyBpZiB4IGlzIG5vdCBJbmZpbml0eSBvciBOYU4uLi5cclxuICAgICAgaWYgKHhjKSB7XHJcblxyXG4gICAgICAgIC8vIHJkIGlzIHRoZSByb3VuZGluZyBkaWdpdCwgaS5lLiB0aGUgZGlnaXQgYWZ0ZXIgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgLy8gbiBpcyBhIGJhc2UgMWUxNCBudW1iZXIsIHRoZSB2YWx1ZSBvZiB0aGUgZWxlbWVudCBvZiBhcnJheSB4LmMgY29udGFpbmluZyByZC5cclxuICAgICAgICAvLyBuaSBpcyB0aGUgaW5kZXggb2YgbiB3aXRoaW4geC5jLlxyXG4gICAgICAgIC8vIGQgaXMgdGhlIG51bWJlciBvZiBkaWdpdHMgb2Ygbi5cclxuICAgICAgICAvLyBpIGlzIHRoZSBpbmRleCBvZiByZCB3aXRoaW4gbiBpbmNsdWRpbmcgbGVhZGluZyB6ZXJvcy5cclxuICAgICAgICAvLyBqIGlzIHRoZSBhY3R1YWwgaW5kZXggb2YgcmQgd2l0aGluIG4gKGlmIDwgMCwgcmQgaXMgYSBsZWFkaW5nIHplcm8pLlxyXG4gICAgICAgIG91dDoge1xyXG5cclxuICAgICAgICAgIC8vIEdldCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudCBvZiB4Yy5cclxuICAgICAgICAgIGZvciAoZCA9IDEsIGsgPSB4Y1swXTsgayA+PSAxMDsgayAvPSAxMCwgZCsrKTtcclxuICAgICAgICAgIGkgPSBzZCAtIGQ7XHJcblxyXG4gICAgICAgICAgLy8gSWYgdGhlIHJvdW5kaW5nIGRpZ2l0IGlzIGluIHRoZSBmaXJzdCBlbGVtZW50IG9mIHhjLi4uXHJcbiAgICAgICAgICBpZiAoaSA8IDApIHtcclxuICAgICAgICAgICAgaSArPSBMT0dfQkFTRTtcclxuICAgICAgICAgICAgaiA9IHNkO1xyXG4gICAgICAgICAgICBuID0geGNbbmkgPSAwXTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgcm91bmRpbmcgZGlnaXQgYXQgaW5kZXggaiBvZiBuLlxyXG4gICAgICAgICAgICByZCA9IG4gLyBwb3dzMTBbZCAtIGogLSAxXSAlIDEwIHwgMDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG5pID0gbWF0aGNlaWwoKGkgKyAxKSAvIExPR19CQVNFKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChuaSA+PSB4Yy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBOZWVkZWQgYnkgc3FydC5cclxuICAgICAgICAgICAgICAgIGZvciAoOyB4Yy5sZW5ndGggPD0gbmk7IHhjLnB1c2goMCkpO1xyXG4gICAgICAgICAgICAgICAgbiA9IHJkID0gMDtcclxuICAgICAgICAgICAgICAgIGQgPSAxO1xyXG4gICAgICAgICAgICAgICAgaSAlPSBMT0dfQkFTRTtcclxuICAgICAgICAgICAgICAgIGogPSBpIC0gTE9HX0JBU0UgKyAxO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBicmVhayBvdXQ7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIG4gPSBrID0geGNbbmldO1xyXG5cclxuICAgICAgICAgICAgICAvLyBHZXQgdGhlIG51bWJlciBvZiBkaWdpdHMgb2Ygbi5cclxuICAgICAgICAgICAgICBmb3IgKGQgPSAxOyBrID49IDEwOyBrIC89IDEwLCBkKyspO1xyXG5cclxuICAgICAgICAgICAgICAvLyBHZXQgdGhlIGluZGV4IG9mIHJkIHdpdGhpbiBuLlxyXG4gICAgICAgICAgICAgIGkgJT0gTE9HX0JBU0U7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEdldCB0aGUgaW5kZXggb2YgcmQgd2l0aGluIG4sIGFkanVzdGVkIGZvciBsZWFkaW5nIHplcm9zLlxyXG4gICAgICAgICAgICAgIC8vIFRoZSBudW1iZXIgb2YgbGVhZGluZyB6ZXJvcyBvZiBuIGlzIGdpdmVuIGJ5IExPR19CQVNFIC0gZC5cclxuICAgICAgICAgICAgICBqID0gaSAtIExPR19CQVNFICsgZDtcclxuXHJcbiAgICAgICAgICAgICAgLy8gR2V0IHRoZSByb3VuZGluZyBkaWdpdCBhdCBpbmRleCBqIG9mIG4uXHJcbiAgICAgICAgICAgICAgcmQgPSBqIDwgMCA/IDAgOiBuIC8gcG93czEwW2QgLSBqIC0gMV0gJSAxMCB8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByID0gciB8fCBzZCA8IDAgfHxcclxuXHJcbiAgICAgICAgICAvLyBBcmUgdGhlcmUgYW55IG5vbi16ZXJvIGRpZ2l0cyBhZnRlciB0aGUgcm91bmRpbmcgZGlnaXQ/XHJcbiAgICAgICAgICAvLyBUaGUgZXhwcmVzc2lvbiAgbiAlIHBvd3MxMFtkIC0gaiAtIDFdICByZXR1cm5zIGFsbCBkaWdpdHMgb2YgbiB0byB0aGUgcmlnaHRcclxuICAgICAgICAgIC8vIG9mIHRoZSBkaWdpdCBhdCBqLCBlLmcuIGlmIG4gaXMgOTA4NzE0IGFuZCBqIGlzIDIsIHRoZSBleHByZXNzaW9uIGdpdmVzIDcxNC5cclxuICAgICAgICAgICB4Y1tuaSArIDFdICE9IG51bGwgfHwgKGogPCAwID8gbiA6IG4gJSBwb3dzMTBbZCAtIGogLSAxXSk7XHJcblxyXG4gICAgICAgICAgciA9IHJtIDwgNFxyXG4gICAgICAgICAgID8gKHJkIHx8IHIpICYmIChybSA9PSAwIHx8IHJtID09ICh4LnMgPCAwID8gMyA6IDIpKVxyXG4gICAgICAgICAgIDogcmQgPiA1IHx8IHJkID09IDUgJiYgKHJtID09IDQgfHwgciB8fCBybSA9PSA2ICYmXHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBkaWdpdCB0byB0aGUgbGVmdCBvZiB0aGUgcm91bmRpbmcgZGlnaXQgaXMgb2RkLlxyXG4gICAgICAgICAgICAoKGkgPiAwID8gaiA+IDAgPyBuIC8gcG93czEwW2QgLSBqXSA6IDAgOiB4Y1tuaSAtIDFdKSAlIDEwKSAmIDEgfHxcclxuICAgICAgICAgICAgIHJtID09ICh4LnMgPCAwID8gOCA6IDcpKTtcclxuXHJcbiAgICAgICAgICBpZiAoc2QgPCAxIHx8ICF4Y1swXSkge1xyXG4gICAgICAgICAgICB4Yy5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgICAgaWYgKHIpIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gQ29udmVydCBzZCB0byBkZWNpbWFsIHBsYWNlcy5cclxuICAgICAgICAgICAgICBzZCAtPSB4LmUgKyAxO1xyXG5cclxuICAgICAgICAgICAgICAvLyAxLCAwLjEsIDAuMDEsIDAuMDAxLCAwLjAwMDEgZXRjLlxyXG4gICAgICAgICAgICAgIHhjWzBdID0gcG93czEwWyhMT0dfQkFTRSAtIHNkICUgTE9HX0JBU0UpICUgTE9HX0JBU0VdO1xyXG4gICAgICAgICAgICAgIHguZSA9IC1zZCB8fCAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgICAgICAgIHhjWzBdID0geC5lID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIGV4Y2VzcyBkaWdpdHMuXHJcbiAgICAgICAgICBpZiAoaSA9PSAwKSB7XHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IG5pO1xyXG4gICAgICAgICAgICBrID0gMTtcclxuICAgICAgICAgICAgbmktLTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHhjLmxlbmd0aCA9IG5pICsgMTtcclxuICAgICAgICAgICAgayA9IHBvd3MxMFtMT0dfQkFTRSAtIGldO1xyXG5cclxuICAgICAgICAgICAgLy8gRS5nLiA1NjcwMCBiZWNvbWVzIDU2MDAwIGlmIDcgaXMgdGhlIHJvdW5kaW5nIGRpZ2l0LlxyXG4gICAgICAgICAgICAvLyBqID4gMCBtZWFucyBpID4gbnVtYmVyIG9mIGxlYWRpbmcgemVyb3Mgb2Ygbi5cclxuICAgICAgICAgICAgeGNbbmldID0gaiA+IDAgPyBtYXRoZmxvb3IobiAvIHBvd3MxMFtkIC0gal0gJSBwb3dzMTBbal0pICogayA6IDA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUm91bmQgdXA/XHJcbiAgICAgICAgICBpZiAocikge1xyXG5cclxuICAgICAgICAgICAgZm9yICg7IDspIHtcclxuXHJcbiAgICAgICAgICAgICAgLy8gSWYgdGhlIGRpZ2l0IHRvIGJlIHJvdW5kZWQgdXAgaXMgaW4gdGhlIGZpcnN0IGVsZW1lbnQgb2YgeGMuLi5cclxuICAgICAgICAgICAgICBpZiAobmkgPT0gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGkgd2lsbCBiZSB0aGUgbGVuZ3RoIG9mIHhjWzBdIGJlZm9yZSBrIGlzIGFkZGVkLlxyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMSwgaiA9IHhjWzBdOyBqID49IDEwOyBqIC89IDEwLCBpKyspO1xyXG4gICAgICAgICAgICAgICAgaiA9IHhjWzBdICs9IGs7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGsgPSAxOyBqID49IDEwOyBqIC89IDEwLCBrKyspO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGlmIGkgIT0gayB0aGUgbGVuZ3RoIGhhcyBpbmNyZWFzZWQuXHJcbiAgICAgICAgICAgICAgICBpZiAoaSAhPSBrKSB7XHJcbiAgICAgICAgICAgICAgICAgIHguZSsrO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoeGNbMF0gPT0gQkFTRSkgeGNbMF0gPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB4Y1tuaV0gKz0gaztcclxuICAgICAgICAgICAgICAgIGlmICh4Y1tuaV0gIT0gQkFTRSkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB4Y1tuaS0tXSA9IDA7XHJcbiAgICAgICAgICAgICAgICBrID0gMTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgICBmb3IgKGkgPSB4Yy5sZW5ndGg7IHhjWy0taV0gPT09IDA7IHhjLnBvcCgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE92ZXJmbG93PyBJbmZpbml0eS5cclxuICAgICAgICBpZiAoeC5lID4gTUFYX0VYUCkge1xyXG4gICAgICAgICAgeC5jID0geC5lID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gVW5kZXJmbG93PyBaZXJvLlxyXG4gICAgICAgIH0gZWxzZSBpZiAoeC5lIDwgTUlOX0VYUCkge1xyXG4gICAgICAgICAgeC5jID0gW3guZSA9IDBdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHg7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHZhbHVlT2Yobikge1xyXG4gICAgICB2YXIgc3RyLFxyXG4gICAgICAgIGUgPSBuLmU7XHJcblxyXG4gICAgICBpZiAoZSA9PT0gbnVsbCkgcmV0dXJuIG4udG9TdHJpbmcoKTtcclxuXHJcbiAgICAgIHN0ciA9IGNvZWZmVG9TdHJpbmcobi5jKTtcclxuXHJcbiAgICAgIHN0ciA9IGUgPD0gVE9fRVhQX05FRyB8fCBlID49IFRPX0VYUF9QT1NcclxuICAgICAgICA/IHRvRXhwb25lbnRpYWwoc3RyLCBlKVxyXG4gICAgICAgIDogdG9GaXhlZFBvaW50KHN0ciwgZSwgJzAnKTtcclxuXHJcbiAgICAgIHJldHVybiBuLnMgPCAwID8gJy0nICsgc3RyIDogc3RyO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBQUk9UT1RZUEUvSU5TVEFOQ0UgTUVUSE9EU1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgYWJzb2x1dGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIuXHJcbiAgICAgKi9cclxuICAgIFAuYWJzb2x1dGVWYWx1ZSA9IFAuYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgeCA9IG5ldyBCaWdOdW1iZXIodGhpcyk7XHJcbiAgICAgIGlmICh4LnMgPCAwKSB4LnMgPSAxO1xyXG4gICAgICByZXR1cm4geDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm5cclxuICAgICAqICAgMSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgKiAgIC0xIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBsZXNzIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqICAgMCBpZiB0aGV5IGhhdmUgdGhlIHNhbWUgdmFsdWUsXHJcbiAgICAgKiAgIG9yIG51bGwgaWYgdGhlIHZhbHVlIG9mIGVpdGhlciBpcyBOYU4uXHJcbiAgICAgKi9cclxuICAgIFAuY29tcGFyZWRUbyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIElmIGRwIGlzIHVuZGVmaW5lZCBvciBudWxsIG9yIHRydWUgb3IgZmFsc2UsIHJldHVybiB0aGUgbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzIG9mIHRoZVxyXG4gICAgICogdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsIG9yIG51bGwgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIMKxSW5maW5pdHkgb3IgTmFOLlxyXG4gICAgICpcclxuICAgICAqIE90aGVyd2lzZSwgaWYgZHAgaXMgYSBudW1iZXIsIHJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXNcclxuICAgICAqIEJpZ051bWJlciByb3VuZGVkIHRvIGEgbWF4aW11bSBvZiBkcCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvclxyXG4gICAgICogUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXM6IGludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC5kZWNpbWFsUGxhY2VzID0gUC5kcCA9IGZ1bmN0aW9uIChkcCwgcm0pIHtcclxuICAgICAgdmFyIGMsIG4sIHYsXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICBpZiAoZHAgIT0gbnVsbCkge1xyXG4gICAgICAgIGludENoZWNrKGRwLCAwLCBNQVgpO1xyXG4gICAgICAgIGlmIChybSA9PSBudWxsKSBybSA9IFJPVU5ESU5HX01PREU7XHJcbiAgICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcblxyXG4gICAgICAgIHJldHVybiByb3VuZChuZXcgQmlnTnVtYmVyKHgpLCBkcCArIHguZSArIDEsIHJtKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCEoYyA9IHguYykpIHJldHVybiBudWxsO1xyXG4gICAgICBuID0gKCh2ID0gYy5sZW5ndGggLSAxKSAtIGJpdEZsb29yKHRoaXMuZSAvIExPR19CQVNFKSkgKiBMT0dfQkFTRTtcclxuXHJcbiAgICAgIC8vIFN1YnRyYWN0IHRoZSBudW1iZXIgb2YgdHJhaWxpbmcgemVyb3Mgb2YgdGhlIGxhc3QgbnVtYmVyLlxyXG4gICAgICBpZiAodiA9IGNbdl0pIGZvciAoOyB2ICUgMTAgPT0gMDsgdiAvPSAxMCwgbi0tKTtcclxuICAgICAgaWYgKG4gPCAwKSBuID0gMDtcclxuXHJcbiAgICAgIHJldHVybiBuO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBuIC8gMCA9IElcclxuICAgICAqICBuIC8gTiA9IE5cclxuICAgICAqICBuIC8gSSA9IDBcclxuICAgICAqICAwIC8gbiA9IDBcclxuICAgICAqICAwIC8gMCA9IE5cclxuICAgICAqICAwIC8gTiA9IE5cclxuICAgICAqICAwIC8gSSA9IDBcclxuICAgICAqICBOIC8gbiA9IE5cclxuICAgICAqICBOIC8gMCA9IE5cclxuICAgICAqICBOIC8gTiA9IE5cclxuICAgICAqICBOIC8gSSA9IE5cclxuICAgICAqICBJIC8gbiA9IElcclxuICAgICAqICBJIC8gMCA9IElcclxuICAgICAqICBJIC8gTiA9IE5cclxuICAgICAqICBJIC8gSSA9IE5cclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBkaXZpZGVkIGJ5IHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLCByb3VuZGVkIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmQgUk9VTkRJTkdfTU9ERS5cclxuICAgICAqL1xyXG4gICAgUC5kaXZpZGVkQnkgPSBQLmRpdiA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBkaXYodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSwgREVDSU1BTF9QTEFDRVMsIFJPVU5ESU5HX01PREUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIGludGVnZXIgcGFydCBvZiBkaXZpZGluZyB0aGUgdmFsdWUgb2YgdGhpc1xyXG4gICAgICogQmlnTnVtYmVyIGJ5IHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgKi9cclxuICAgIFAuZGl2aWRlZFRvSW50ZWdlckJ5ID0gUC5pZGl2ID0gZnVuY3Rpb24gKHksIGIpIHtcclxuICAgICAgcmV0dXJuIGRpdih0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpLCAwLCAxKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGV4cG9uZW50aWF0ZWQgYnkgbi5cclxuICAgICAqXHJcbiAgICAgKiBJZiBtIGlzIHByZXNlbnQsIHJldHVybiB0aGUgcmVzdWx0IG1vZHVsbyBtLlxyXG4gICAgICogSWYgbiBpcyBuZWdhdGl2ZSByb3VuZCBhY2NvcmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYW5kIFJPVU5ESU5HX01PREUuXHJcbiAgICAgKiBJZiBQT1dfUFJFQ0lTSU9OIGlzIG5vbi16ZXJvIGFuZCBtIGlzIG5vdCBwcmVzZW50LCByb3VuZCB0byBQT1dfUFJFQ0lTSU9OIHVzaW5nIFJPVU5ESU5HX01PREUuXHJcbiAgICAgKlxyXG4gICAgICogVGhlIG1vZHVsYXIgcG93ZXIgb3BlcmF0aW9uIHdvcmtzIGVmZmljaWVudGx5IHdoZW4geCwgbiwgYW5kIG0gYXJlIGludGVnZXJzLCBvdGhlcndpc2UgaXRcclxuICAgICAqIGlzIGVxdWl2YWxlbnQgdG8gY2FsY3VsYXRpbmcgeC5leHBvbmVudGlhdGVkQnkobikubW9kdWxvKG0pIHdpdGggYSBQT1dfUFJFQ0lTSU9OIG9mIDAuXHJcbiAgICAgKlxyXG4gICAgICogbiB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9IFRoZSBleHBvbmVudC4gQW4gaW50ZWdlci5cclxuICAgICAqIFttXSB7bnVtYmVyfHN0cmluZ3xCaWdOdW1iZXJ9IFRoZSBtb2R1bHVzLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBFeHBvbmVudCBub3QgYW4gaW50ZWdlcjoge259J1xyXG4gICAgICovXHJcbiAgICBQLmV4cG9uZW50aWF0ZWRCeSA9IFAucG93ID0gZnVuY3Rpb24gKG4sIG0pIHtcclxuICAgICAgdmFyIGhhbGYsIGlzTW9kRXhwLCBpLCBrLCBtb3JlLCBuSXNCaWcsIG5Jc05lZywgbklzT2RkLCB5LFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgbiA9IG5ldyBCaWdOdW1iZXIobik7XHJcblxyXG4gICAgICAvLyBBbGxvdyBOYU4gYW5kIMKxSW5maW5pdHksIGJ1dCBub3Qgb3RoZXIgbm9uLWludGVnZXJzLlxyXG4gICAgICBpZiAobi5jICYmICFuLmlzSW50ZWdlcigpKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3JcclxuICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdFeHBvbmVudCBub3QgYW4gaW50ZWdlcjogJyArIHZhbHVlT2YobikpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobSAhPSBudWxsKSBtID0gbmV3IEJpZ051bWJlcihtKTtcclxuXHJcbiAgICAgIC8vIEV4cG9uZW50IG9mIE1BWF9TQUZFX0lOVEVHRVIgaXMgMTUuXHJcbiAgICAgIG5Jc0JpZyA9IG4uZSA+IDE0O1xyXG5cclxuICAgICAgLy8gSWYgeCBpcyBOYU4sIMKxSW5maW5pdHksIMKxMCBvciDCsTEsIG9yIG4gaXMgwrFJbmZpbml0eSwgTmFOIG9yIMKxMC5cclxuICAgICAgaWYgKCF4LmMgfHwgIXguY1swXSB8fCB4LmNbMF0gPT0gMSAmJiAheC5lICYmIHguYy5sZW5ndGggPT0gMSB8fCAhbi5jIHx8ICFuLmNbMF0pIHtcclxuXHJcbiAgICAgICAgLy8gVGhlIHNpZ24gb2YgdGhlIHJlc3VsdCBvZiBwb3cgd2hlbiB4IGlzIG5lZ2F0aXZlIGRlcGVuZHMgb24gdGhlIGV2ZW5uZXNzIG9mIG4uXHJcbiAgICAgICAgLy8gSWYgK24gb3ZlcmZsb3dzIHRvIMKxSW5maW5pdHksIHRoZSBldmVubmVzcyBvZiBuIHdvdWxkIGJlIG5vdCBiZSBrbm93bi5cclxuICAgICAgICB5ID0gbmV3IEJpZ051bWJlcihNYXRoLnBvdygrdmFsdWVPZih4KSwgbklzQmlnID8gMiAtIGlzT2RkKG4pIDogK3ZhbHVlT2YobikpKTtcclxuICAgICAgICByZXR1cm4gbSA/IHkubW9kKG0pIDogeTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbklzTmVnID0gbi5zIDwgMDtcclxuXHJcbiAgICAgIGlmIChtKSB7XHJcblxyXG4gICAgICAgIC8vIHggJSBtIHJldHVybnMgTmFOIGlmIGFicyhtKSBpcyB6ZXJvLCBvciBtIGlzIE5hTi5cclxuICAgICAgICBpZiAobS5jID8gIW0uY1swXSA6ICFtLnMpIHJldHVybiBuZXcgQmlnTnVtYmVyKE5hTik7XHJcblxyXG4gICAgICAgIGlzTW9kRXhwID0gIW5Jc05lZyAmJiB4LmlzSW50ZWdlcigpICYmIG0uaXNJbnRlZ2VyKCk7XHJcblxyXG4gICAgICAgIGlmIChpc01vZEV4cCkgeCA9IHgubW9kKG0pO1xyXG5cclxuICAgICAgLy8gT3ZlcmZsb3cgdG8gwrFJbmZpbml0eTogPj0yKioxZTEwIG9yID49MS4wMDAwMDI0KioxZTE1LlxyXG4gICAgICAvLyBVbmRlcmZsb3cgdG8gwrEwOiA8PTAuNzkqKjFlMTAgb3IgPD0wLjk5OTk5NzUqKjFlMTUuXHJcbiAgICAgIH0gZWxzZSBpZiAobi5lID4gOSAmJiAoeC5lID4gMCB8fCB4LmUgPCAtMSB8fCAoeC5lID09IDBcclxuICAgICAgICAvLyBbMSwgMjQwMDAwMDAwXVxyXG4gICAgICAgID8geC5jWzBdID4gMSB8fCBuSXNCaWcgJiYgeC5jWzFdID49IDI0ZTdcclxuICAgICAgICAvLyBbODAwMDAwMDAwMDAwMDBdICBbOTk5OTk3NTAwMDAwMDBdXHJcbiAgICAgICAgOiB4LmNbMF0gPCA4ZTEzIHx8IG5Jc0JpZyAmJiB4LmNbMF0gPD0gOTk5OTk3NWU3KSkpIHtcclxuXHJcbiAgICAgICAgLy8gSWYgeCBpcyBuZWdhdGl2ZSBhbmQgbiBpcyBvZGQsIGsgPSAtMCwgZWxzZSBrID0gMC5cclxuICAgICAgICBrID0geC5zIDwgMCAmJiBpc09kZChuKSA/IC0wIDogMDtcclxuXHJcbiAgICAgICAgLy8gSWYgeCA+PSAxLCBrID0gwrFJbmZpbml0eS5cclxuICAgICAgICBpZiAoeC5lID4gLTEpIGsgPSAxIC8gaztcclxuXHJcbiAgICAgICAgLy8gSWYgbiBpcyBuZWdhdGl2ZSByZXR1cm4gwrEwLCBlbHNlIHJldHVybiDCsUluZmluaXR5LlxyXG4gICAgICAgIHJldHVybiBuZXcgQmlnTnVtYmVyKG5Jc05lZyA/IDEgLyBrIDogayk7XHJcblxyXG4gICAgICB9IGVsc2UgaWYgKFBPV19QUkVDSVNJT04pIHtcclxuXHJcbiAgICAgICAgLy8gVHJ1bmNhdGluZyBlYWNoIGNvZWZmaWNpZW50IGFycmF5IHRvIGEgbGVuZ3RoIG9mIGsgYWZ0ZXIgZWFjaCBtdWx0aXBsaWNhdGlvblxyXG4gICAgICAgIC8vIGVxdWF0ZXMgdG8gdHJ1bmNhdGluZyBzaWduaWZpY2FudCBkaWdpdHMgdG8gUE9XX1BSRUNJU0lPTiArIFsyOCwgNDFdLFxyXG4gICAgICAgIC8vIGkuZS4gdGhlcmUgd2lsbCBiZSBhIG1pbmltdW0gb2YgMjggZ3VhcmQgZGlnaXRzIHJldGFpbmVkLlxyXG4gICAgICAgIGsgPSBtYXRoY2VpbChQT1dfUFJFQ0lTSU9OIC8gTE9HX0JBU0UgKyAyKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG5Jc0JpZykge1xyXG4gICAgICAgIGhhbGYgPSBuZXcgQmlnTnVtYmVyKDAuNSk7XHJcbiAgICAgICAgaWYgKG5Jc05lZykgbi5zID0gMTtcclxuICAgICAgICBuSXNPZGQgPSBpc09kZChuKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpID0gTWF0aC5hYnMoK3ZhbHVlT2YobikpO1xyXG4gICAgICAgIG5Jc09kZCA9IGkgJSAyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcihPTkUpO1xyXG5cclxuICAgICAgLy8gUGVyZm9ybXMgNTQgbG9vcCBpdGVyYXRpb25zIGZvciBuIG9mIDkwMDcxOTkyNTQ3NDA5OTEuXHJcbiAgICAgIGZvciAoOyA7KSB7XHJcblxyXG4gICAgICAgIGlmIChuSXNPZGQpIHtcclxuICAgICAgICAgIHkgPSB5LnRpbWVzKHgpO1xyXG4gICAgICAgICAgaWYgKCF5LmMpIGJyZWFrO1xyXG5cclxuICAgICAgICAgIGlmIChrKSB7XHJcbiAgICAgICAgICAgIGlmICh5LmMubGVuZ3RoID4gaykgeS5jLmxlbmd0aCA9IGs7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGlzTW9kRXhwKSB7XHJcbiAgICAgICAgICAgIHkgPSB5Lm1vZChtKTsgICAgLy95ID0geS5taW51cyhkaXYoeSwgbSwgMCwgTU9EVUxPX01PREUpLnRpbWVzKG0pKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpKSB7XHJcbiAgICAgICAgICBpID0gbWF0aGZsb29yKGkgLyAyKTtcclxuICAgICAgICAgIGlmIChpID09PSAwKSBicmVhaztcclxuICAgICAgICAgIG5Jc09kZCA9IGkgJSAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBuID0gbi50aW1lcyhoYWxmKTtcclxuICAgICAgICAgIHJvdW5kKG4sIG4uZSArIDEsIDEpO1xyXG5cclxuICAgICAgICAgIGlmIChuLmUgPiAxNCkge1xyXG4gICAgICAgICAgICBuSXNPZGQgPSBpc09kZChuKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGkgPSArdmFsdWVPZihuKTtcclxuICAgICAgICAgICAgaWYgKGkgPT09IDApIGJyZWFrO1xyXG4gICAgICAgICAgICBuSXNPZGQgPSBpICUgMjtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHggPSB4LnRpbWVzKHgpO1xyXG5cclxuICAgICAgICBpZiAoaykge1xyXG4gICAgICAgICAgaWYgKHguYyAmJiB4LmMubGVuZ3RoID4gaykgeC5jLmxlbmd0aCA9IGs7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpc01vZEV4cCkge1xyXG4gICAgICAgICAgeCA9IHgubW9kKG0pOyAgICAvL3ggPSB4Lm1pbnVzKGRpdih4LCBtLCAwLCBNT0RVTE9fTU9ERSkudGltZXMobSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGlzTW9kRXhwKSByZXR1cm4geTtcclxuICAgICAgaWYgKG5Jc05lZykgeSA9IE9ORS5kaXYoeSk7XHJcblxyXG4gICAgICByZXR1cm4gbSA/IHkubW9kKG0pIDogayA/IHJvdW5kKHksIFBPV19QUkVDSVNJT04sIFJPVU5ESU5HX01PREUsIG1vcmUpIDogeTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciByb3VuZGVkIHRvIGFuIGludGVnZXJcclxuICAgICAqIHVzaW5nIHJvdW5kaW5nIG1vZGUgcm0sIG9yIFJPVU5ESU5HX01PREUgaWYgcm0gaXMgb21pdHRlZC5cclxuICAgICAqXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtybX0nXHJcbiAgICAgKi9cclxuICAgIFAuaW50ZWdlclZhbHVlID0gZnVuY3Rpb24gKHJtKSB7XHJcbiAgICAgIHZhciBuID0gbmV3IEJpZ051bWJlcih0aGlzKTtcclxuICAgICAgaWYgKHJtID09IG51bGwpIHJtID0gUk9VTkRJTkdfTU9ERTtcclxuICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcbiAgICAgIHJldHVybiByb3VuZChuLCBuLmUgKyAxLCBybSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZiBCaWdOdW1iZXIoeSwgYiksXHJcbiAgICAgKiBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzRXF1YWxUbyA9IFAuZXEgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gY29tcGFyZSh0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpKSA9PT0gMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgYSBmaW5pdGUgbnVtYmVyLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzRmluaXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gISF0aGlzLmM7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGdyZWF0ZXIgdGhhbiB0aGUgdmFsdWUgb2YgQmlnTnVtYmVyKHksIGIpLFxyXG4gICAgICogb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc0dyZWF0ZXJUaGFuID0gUC5ndCA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpID4gMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzR3JlYXRlclRoYW5PckVxdWFsVG8gPSBQLmd0ZSA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHJldHVybiAoYiA9IGNvbXBhcmUodGhpcywgbmV3IEJpZ051bWJlcih5LCBiKSkpID09PSAxIHx8IGIgPT09IDA7XHJcblxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBhbiBpbnRlZ2VyLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzSW50ZWdlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuICEhdGhpcy5jICYmIGJpdEZsb29yKHRoaXMuZSAvIExPR19CQVNFKSA+IHRoaXMuYy5sZW5ndGggLSAyO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyBsZXNzIHRoYW4gdGhlIHZhbHVlIG9mIEJpZ051bWJlcih5LCBiKSxcclxuICAgICAqIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNMZXNzVGhhbiA9IFAubHQgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gY29tcGFyZSh0aGlzLCBuZXcgQmlnTnVtYmVyKHksIGIpKSA8IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgdmFsdWUgb2ZcclxuICAgICAqIEJpZ051bWJlcih5LCBiKSwgb3RoZXJ3aXNlIHJldHVybiBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5pc0xlc3NUaGFuT3JFcXVhbFRvID0gUC5sdGUgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICByZXR1cm4gKGIgPSBjb21wYXJlKHRoaXMsIG5ldyBCaWdOdW1iZXIoeSwgYikpKSA9PT0gLTEgfHwgYiA9PT0gMDtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgTmFOLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzTmFOID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gIXRoaXMucztcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaXMgbmVnYXRpdmUsIG90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuaXNOZWdhdGl2ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucyA8IDA7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIHBvc2l0aXZlLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzUG9zaXRpdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnMgPiAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpcyAwIG9yIC0wLCBvdGhlcndpc2UgcmV0dXJuIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmlzWmVybyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuICEhdGhpcy5jICYmIHRoaXMuY1swXSA9PSAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBuIC0gMCA9IG5cclxuICAgICAqICBuIC0gTiA9IE5cclxuICAgICAqICBuIC0gSSA9IC1JXHJcbiAgICAgKiAgMCAtIG4gPSAtblxyXG4gICAgICogIDAgLSAwID0gMFxyXG4gICAgICogIDAgLSBOID0gTlxyXG4gICAgICogIDAgLSBJID0gLUlcclxuICAgICAqICBOIC0gbiA9IE5cclxuICAgICAqICBOIC0gMCA9IE5cclxuICAgICAqICBOIC0gTiA9IE5cclxuICAgICAqICBOIC0gSSA9IE5cclxuICAgICAqICBJIC0gbiA9IElcclxuICAgICAqICBJIC0gMCA9IElcclxuICAgICAqICBJIC0gTiA9IE5cclxuICAgICAqICBJIC0gSSA9IE5cclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBtaW51cyB0aGUgdmFsdWUgb2ZcclxuICAgICAqIEJpZ051bWJlcih5LCBiKS5cclxuICAgICAqL1xyXG4gICAgUC5taW51cyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciBpLCBqLCB0LCB4TFR5LFxyXG4gICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgIGEgPSB4LnM7XHJcblxyXG4gICAgICB5ID0gbmV3IEJpZ051bWJlcih5LCBiKTtcclxuICAgICAgYiA9IHkucztcclxuXHJcbiAgICAgIC8vIEVpdGhlciBOYU4/XHJcbiAgICAgIGlmICghYSB8fCAhYikgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgICAgaWYgKGEgIT0gYikge1xyXG4gICAgICAgIHkucyA9IC1iO1xyXG4gICAgICAgIHJldHVybiB4LnBsdXMoeSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciB4ZSA9IHguZSAvIExPR19CQVNFLFxyXG4gICAgICAgIHllID0geS5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICBpZiAoIXhlIHx8ICF5ZSkge1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgSW5maW5pdHk/XHJcbiAgICAgICAgaWYgKCF4YyB8fCAheWMpIHJldHVybiB4YyA/ICh5LnMgPSAtYiwgeSkgOiBuZXcgQmlnTnVtYmVyKHljID8geCA6IE5hTik7XHJcblxyXG4gICAgICAgIC8vIEVpdGhlciB6ZXJvP1xyXG4gICAgICAgIGlmICgheGNbMF0gfHwgIXljWzBdKSB7XHJcblxyXG4gICAgICAgICAgLy8gUmV0dXJuIHkgaWYgeSBpcyBub24temVybywgeCBpZiB4IGlzIG5vbi16ZXJvLCBvciB6ZXJvIGlmIGJvdGggYXJlIHplcm8uXHJcbiAgICAgICAgICByZXR1cm4geWNbMF0gPyAoeS5zID0gLWIsIHkpIDogbmV3IEJpZ051bWJlcih4Y1swXSA/IHggOlxyXG5cclxuICAgICAgICAgICAvLyBJRUVFIDc1NCAoMjAwOCkgNi4zOiBuIC0gbiA9IC0wIHdoZW4gcm91bmRpbmcgdG8gLUluZmluaXR5XHJcbiAgICAgICAgICAgUk9VTkRJTkdfTU9ERSA9PSAzID8gLTAgOiAwKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHhlID0gYml0Rmxvb3IoeGUpO1xyXG4gICAgICB5ZSA9IGJpdEZsb29yKHllKTtcclxuICAgICAgeGMgPSB4Yy5zbGljZSgpO1xyXG5cclxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGlzIHRoZSBiaWdnZXIgbnVtYmVyLlxyXG4gICAgICBpZiAoYSA9IHhlIC0geWUpIHtcclxuXHJcbiAgICAgICAgaWYgKHhMVHkgPSBhIDwgMCkge1xyXG4gICAgICAgICAgYSA9IC1hO1xyXG4gICAgICAgICAgdCA9IHhjO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdC5yZXZlcnNlKCk7XHJcblxyXG4gICAgICAgIC8vIFByZXBlbmQgemVyb3MgdG8gZXF1YWxpc2UgZXhwb25lbnRzLlxyXG4gICAgICAgIGZvciAoYiA9IGE7IGItLTsgdC5wdXNoKDApKTtcclxuICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgLy8gRXhwb25lbnRzIGVxdWFsLiBDaGVjayBkaWdpdCBieSBkaWdpdC5cclxuICAgICAgICBqID0gKHhMVHkgPSAoYSA9IHhjLmxlbmd0aCkgPCAoYiA9IHljLmxlbmd0aCkpID8gYSA6IGI7XHJcblxyXG4gICAgICAgIGZvciAoYSA9IGIgPSAwOyBiIDwgajsgYisrKSB7XHJcblxyXG4gICAgICAgICAgaWYgKHhjW2JdICE9IHljW2JdKSB7XHJcbiAgICAgICAgICAgIHhMVHkgPSB4Y1tiXSA8IHljW2JdO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHggPCB5PyBQb2ludCB4YyB0byB0aGUgYXJyYXkgb2YgdGhlIGJpZ2dlciBudW1iZXIuXHJcbiAgICAgIGlmICh4TFR5KSB0ID0geGMsIHhjID0geWMsIHljID0gdCwgeS5zID0gLXkucztcclxuXHJcbiAgICAgIGIgPSAoaiA9IHljLmxlbmd0aCkgLSAoaSA9IHhjLmxlbmd0aCk7XHJcblxyXG4gICAgICAvLyBBcHBlbmQgemVyb3MgdG8geGMgaWYgc2hvcnRlci5cclxuICAgICAgLy8gTm8gbmVlZCB0byBhZGQgemVyb3MgdG8geWMgaWYgc2hvcnRlciBhcyBzdWJ0cmFjdCBvbmx5IG5lZWRzIHRvIHN0YXJ0IGF0IHljLmxlbmd0aC5cclxuICAgICAgaWYgKGIgPiAwKSBmb3IgKDsgYi0tOyB4Y1tpKytdID0gMCk7XHJcbiAgICAgIGIgPSBCQVNFIC0gMTtcclxuXHJcbiAgICAgIC8vIFN1YnRyYWN0IHljIGZyb20geGMuXHJcbiAgICAgIGZvciAoOyBqID4gYTspIHtcclxuXHJcbiAgICAgICAgaWYgKHhjWy0tal0gPCB5Y1tqXSkge1xyXG4gICAgICAgICAgZm9yIChpID0gajsgaSAmJiAheGNbLS1pXTsgeGNbaV0gPSBiKTtcclxuICAgICAgICAgIC0teGNbaV07XHJcbiAgICAgICAgICB4Y1tqXSArPSBCQVNFO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeGNbal0gLT0geWNbal07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJlbW92ZSBsZWFkaW5nIHplcm9zIGFuZCBhZGp1c3QgZXhwb25lbnQgYWNjb3JkaW5nbHkuXHJcbiAgICAgIGZvciAoOyB4Y1swXSA9PSAwOyB4Yy5zcGxpY2UoMCwgMSksIC0teWUpO1xyXG5cclxuICAgICAgLy8gWmVybz9cclxuICAgICAgaWYgKCF4Y1swXSkge1xyXG5cclxuICAgICAgICAvLyBGb2xsb3dpbmcgSUVFRSA3NTQgKDIwMDgpIDYuMyxcclxuICAgICAgICAvLyBuIC0gbiA9ICswICBidXQgIG4gLSBuID0gLTAgIHdoZW4gcm91bmRpbmcgdG93YXJkcyAtSW5maW5pdHkuXHJcbiAgICAgICAgeS5zID0gUk9VTkRJTkdfTU9ERSA9PSAzID8gLTEgOiAxO1xyXG4gICAgICAgIHkuYyA9IFt5LmUgPSAwXTtcclxuICAgICAgICByZXR1cm4geTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTm8gbmVlZCB0byBjaGVjayBmb3IgSW5maW5pdHkgYXMgK3ggLSAreSAhPSBJbmZpbml0eSAmJiAteCAtIC15ICE9IEluZmluaXR5XHJcbiAgICAgIC8vIGZvciBmaW5pdGUgeCBhbmQgeS5cclxuICAgICAgcmV0dXJuIG5vcm1hbGlzZSh5LCB4YywgeWUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICAgbiAlIDAgPSAgTlxyXG4gICAgICogICBuICUgTiA9ICBOXHJcbiAgICAgKiAgIG4gJSBJID0gIG5cclxuICAgICAqICAgMCAlIG4gPSAgMFxyXG4gICAgICogIC0wICUgbiA9IC0wXHJcbiAgICAgKiAgIDAgJSAwID0gIE5cclxuICAgICAqICAgMCAlIE4gPSAgTlxyXG4gICAgICogICAwICUgSSA9ICAwXHJcbiAgICAgKiAgIE4gJSBuID0gIE5cclxuICAgICAqICAgTiAlIDAgPSAgTlxyXG4gICAgICogICBOICUgTiA9ICBOXHJcbiAgICAgKiAgIE4gJSBJID0gIE5cclxuICAgICAqICAgSSAlIG4gPSAgTlxyXG4gICAgICogICBJICUgMCA9ICBOXHJcbiAgICAgKiAgIEkgJSBOID0gIE5cclxuICAgICAqICAgSSAlIEkgPSAgTlxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG1vZHVsbyB0aGUgdmFsdWUgb2ZcclxuICAgICAqIEJpZ051bWJlcih5LCBiKS4gVGhlIHJlc3VsdCBkZXBlbmRzIG9uIHRoZSB2YWx1ZSBvZiBNT0RVTE9fTU9ERS5cclxuICAgICAqL1xyXG4gICAgUC5tb2R1bG8gPSBQLm1vZCA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciBxLCBzLFxyXG4gICAgICAgIHggPSB0aGlzO1xyXG5cclxuICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoeSwgYik7XHJcblxyXG4gICAgICAvLyBSZXR1cm4gTmFOIGlmIHggaXMgSW5maW5pdHkgb3IgTmFOLCBvciB5IGlzIE5hTiBvciB6ZXJvLlxyXG4gICAgICBpZiAoIXguYyB8fCAheS5zIHx8IHkuYyAmJiAheS5jWzBdKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCaWdOdW1iZXIoTmFOKTtcclxuXHJcbiAgICAgIC8vIFJldHVybiB4IGlmIHkgaXMgSW5maW5pdHkgb3IgeCBpcyB6ZXJvLlxyXG4gICAgICB9IGVsc2UgaWYgKCF5LmMgfHwgeC5jICYmICF4LmNbMF0pIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcih4KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKE1PRFVMT19NT0RFID09IDkpIHtcclxuXHJcbiAgICAgICAgLy8gRXVjbGlkaWFuIGRpdmlzaW9uOiBxID0gc2lnbih5KSAqIGZsb29yKHggLyBhYnMoeSkpXHJcbiAgICAgICAgLy8gciA9IHggLSBxeSAgICB3aGVyZSAgMCA8PSByIDwgYWJzKHkpXHJcbiAgICAgICAgcyA9IHkucztcclxuICAgICAgICB5LnMgPSAxO1xyXG4gICAgICAgIHEgPSBkaXYoeCwgeSwgMCwgMyk7XHJcbiAgICAgICAgeS5zID0gcztcclxuICAgICAgICBxLnMgKj0gcztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBxID0gZGl2KHgsIHksIDAsIE1PRFVMT19NT0RFKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgeSA9IHgubWludXMocS50aW1lcyh5KSk7XHJcblxyXG4gICAgICAvLyBUbyBtYXRjaCBKYXZhU2NyaXB0ICUsIGVuc3VyZSBzaWduIG9mIHplcm8gaXMgc2lnbiBvZiBkaXZpZGVuZC5cclxuICAgICAgaWYgKCF5LmNbMF0gJiYgTU9EVUxPX01PREUgPT0gMSkgeS5zID0geC5zO1xyXG5cclxuICAgICAgcmV0dXJuIHk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogIG4gKiAwID0gMFxyXG4gICAgICogIG4gKiBOID0gTlxyXG4gICAgICogIG4gKiBJID0gSVxyXG4gICAgICogIDAgKiBuID0gMFxyXG4gICAgICogIDAgKiAwID0gMFxyXG4gICAgICogIDAgKiBOID0gTlxyXG4gICAgICogIDAgKiBJID0gTlxyXG4gICAgICogIE4gKiBuID0gTlxyXG4gICAgICogIE4gKiAwID0gTlxyXG4gICAgICogIE4gKiBOID0gTlxyXG4gICAgICogIE4gKiBJID0gTlxyXG4gICAgICogIEkgKiBuID0gSVxyXG4gICAgICogIEkgKiAwID0gTlxyXG4gICAgICogIEkgKiBOID0gTlxyXG4gICAgICogIEkgKiBJID0gSVxyXG4gICAgICpcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG11bHRpcGxpZWQgYnkgdGhlIHZhbHVlXHJcbiAgICAgKiBvZiBCaWdOdW1iZXIoeSwgYikuXHJcbiAgICAgKi9cclxuICAgIFAubXVsdGlwbGllZEJ5ID0gUC50aW1lcyA9IGZ1bmN0aW9uICh5LCBiKSB7XHJcbiAgICAgIHZhciBjLCBlLCBpLCBqLCBrLCBtLCB4Y0wsIHhsbywgeGhpLCB5Y0wsIHlsbywgeWhpLCB6YyxcclxuICAgICAgICBiYXNlLCBzcXJ0QmFzZSxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICB5YyA9ICh5ID0gbmV3IEJpZ051bWJlcih5LCBiKSkuYztcclxuXHJcbiAgICAgIC8vIEVpdGhlciBOYU4sIMKxSW5maW5pdHkgb3IgwrEwP1xyXG4gICAgICBpZiAoIXhjIHx8ICF5YyB8fCAheGNbMF0gfHwgIXljWzBdKSB7XHJcblxyXG4gICAgICAgIC8vIFJldHVybiBOYU4gaWYgZWl0aGVyIGlzIE5hTiwgb3Igb25lIGlzIDAgYW5kIHRoZSBvdGhlciBpcyBJbmZpbml0eS5cclxuICAgICAgICBpZiAoIXgucyB8fCAheS5zIHx8IHhjICYmICF4Y1swXSAmJiAheWMgfHwgeWMgJiYgIXljWzBdICYmICF4Yykge1xyXG4gICAgICAgICAgeS5jID0geS5lID0geS5zID0gbnVsbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgeS5zICo9IHgucztcclxuXHJcbiAgICAgICAgICAvLyBSZXR1cm4gwrFJbmZpbml0eSBpZiBlaXRoZXIgaXMgwrFJbmZpbml0eS5cclxuICAgICAgICAgIGlmICgheGMgfHwgIXljKSB7XHJcbiAgICAgICAgICAgIHkuYyA9IHkuZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgLy8gUmV0dXJuIMKxMCBpZiBlaXRoZXIgaXMgwrEwLlxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgeS5jID0gWzBdO1xyXG4gICAgICAgICAgICB5LmUgPSAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGUgPSBiaXRGbG9vcih4LmUgLyBMT0dfQkFTRSkgKyBiaXRGbG9vcih5LmUgLyBMT0dfQkFTRSk7XHJcbiAgICAgIHkucyAqPSB4LnM7XHJcbiAgICAgIHhjTCA9IHhjLmxlbmd0aDtcclxuICAgICAgeWNMID0geWMubGVuZ3RoO1xyXG5cclxuICAgICAgLy8gRW5zdXJlIHhjIHBvaW50cyB0byBsb25nZXIgYXJyYXkgYW5kIHhjTCB0byBpdHMgbGVuZ3RoLlxyXG4gICAgICBpZiAoeGNMIDwgeWNMKSB6YyA9IHhjLCB4YyA9IHljLCB5YyA9IHpjLCBpID0geGNMLCB4Y0wgPSB5Y0wsIHljTCA9IGk7XHJcblxyXG4gICAgICAvLyBJbml0aWFsaXNlIHRoZSByZXN1bHQgYXJyYXkgd2l0aCB6ZXJvcy5cclxuICAgICAgZm9yIChpID0geGNMICsgeWNMLCB6YyA9IFtdOyBpLS07IHpjLnB1c2goMCkpO1xyXG5cclxuICAgICAgYmFzZSA9IEJBU0U7XHJcbiAgICAgIHNxcnRCYXNlID0gU1FSVF9CQVNFO1xyXG5cclxuICAgICAgZm9yIChpID0geWNMOyAtLWkgPj0gMDspIHtcclxuICAgICAgICBjID0gMDtcclxuICAgICAgICB5bG8gPSB5Y1tpXSAlIHNxcnRCYXNlO1xyXG4gICAgICAgIHloaSA9IHljW2ldIC8gc3FydEJhc2UgfCAwO1xyXG5cclxuICAgICAgICBmb3IgKGsgPSB4Y0wsIGogPSBpICsgazsgaiA+IGk7KSB7XHJcbiAgICAgICAgICB4bG8gPSB4Y1stLWtdICUgc3FydEJhc2U7XHJcbiAgICAgICAgICB4aGkgPSB4Y1trXSAvIHNxcnRCYXNlIHwgMDtcclxuICAgICAgICAgIG0gPSB5aGkgKiB4bG8gKyB4aGkgKiB5bG87XHJcbiAgICAgICAgICB4bG8gPSB5bG8gKiB4bG8gKyAoKG0gJSBzcXJ0QmFzZSkgKiBzcXJ0QmFzZSkgKyB6Y1tqXSArIGM7XHJcbiAgICAgICAgICBjID0gKHhsbyAvIGJhc2UgfCAwKSArIChtIC8gc3FydEJhc2UgfCAwKSArIHloaSAqIHhoaTtcclxuICAgICAgICAgIHpjW2otLV0gPSB4bG8gJSBiYXNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgemNbal0gPSBjO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoYykge1xyXG4gICAgICAgICsrZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB6Yy5zcGxpY2UoMCwgMSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBub3JtYWxpc2UoeSwgemMsIGUpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWdOdW1iZXIgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIG5lZ2F0ZWQsXHJcbiAgICAgKiBpLmUuIG11bHRpcGxpZWQgYnkgLTEuXHJcbiAgICAgKi9cclxuICAgIFAubmVnYXRlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHggPSBuZXcgQmlnTnVtYmVyKHRoaXMpO1xyXG4gICAgICB4LnMgPSAteC5zIHx8IG51bGw7XHJcbiAgICAgIHJldHVybiB4O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqICBuICsgMCA9IG5cclxuICAgICAqICBuICsgTiA9IE5cclxuICAgICAqICBuICsgSSA9IElcclxuICAgICAqICAwICsgbiA9IG5cclxuICAgICAqICAwICsgMCA9IDBcclxuICAgICAqICAwICsgTiA9IE5cclxuICAgICAqICAwICsgSSA9IElcclxuICAgICAqICBOICsgbiA9IE5cclxuICAgICAqICBOICsgMCA9IE5cclxuICAgICAqICBOICsgTiA9IE5cclxuICAgICAqICBOICsgSSA9IE5cclxuICAgICAqICBJICsgbiA9IElcclxuICAgICAqICBJICsgMCA9IElcclxuICAgICAqICBJICsgTiA9IE5cclxuICAgICAqICBJICsgSSA9IElcclxuICAgICAqXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnTnVtYmVyIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBwbHVzIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnTnVtYmVyKHksIGIpLlxyXG4gICAgICovXHJcbiAgICBQLnBsdXMgPSBmdW5jdGlvbiAoeSwgYikge1xyXG4gICAgICB2YXIgdCxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICBhID0geC5zO1xyXG5cclxuICAgICAgeSA9IG5ldyBCaWdOdW1iZXIoeSwgYik7XHJcbiAgICAgIGIgPSB5LnM7XHJcblxyXG4gICAgICAvLyBFaXRoZXIgTmFOP1xyXG4gICAgICBpZiAoIWEgfHwgIWIpIHJldHVybiBuZXcgQmlnTnVtYmVyKE5hTik7XHJcblxyXG4gICAgICAvLyBTaWducyBkaWZmZXI/XHJcbiAgICAgICBpZiAoYSAhPSBiKSB7XHJcbiAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgICAgcmV0dXJuIHgubWludXMoeSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciB4ZSA9IHguZSAvIExPR19CQVNFLFxyXG4gICAgICAgIHllID0geS5lIC8gTE9HX0JBU0UsXHJcbiAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgeWMgPSB5LmM7XHJcblxyXG4gICAgICBpZiAoIXhlIHx8ICF5ZSkge1xyXG5cclxuICAgICAgICAvLyBSZXR1cm4gwrFJbmZpbml0eSBpZiBlaXRoZXIgwrFJbmZpbml0eS5cclxuICAgICAgICBpZiAoIXhjIHx8ICF5YykgcmV0dXJuIG5ldyBCaWdOdW1iZXIoYSAvIDApO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgemVybz9cclxuICAgICAgICAvLyBSZXR1cm4geSBpZiB5IGlzIG5vbi16ZXJvLCB4IGlmIHggaXMgbm9uLXplcm8sIG9yIHplcm8gaWYgYm90aCBhcmUgemVyby5cclxuICAgICAgICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkgcmV0dXJuIHljWzBdID8geSA6IG5ldyBCaWdOdW1iZXIoeGNbMF0gPyB4IDogYSAqIDApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB4ZSA9IGJpdEZsb29yKHhlKTtcclxuICAgICAgeWUgPSBiaXRGbG9vcih5ZSk7XHJcbiAgICAgIHhjID0geGMuc2xpY2UoKTtcclxuXHJcbiAgICAgIC8vIFByZXBlbmQgemVyb3MgdG8gZXF1YWxpc2UgZXhwb25lbnRzLiBGYXN0ZXIgdG8gdXNlIHJldmVyc2UgdGhlbiBkbyB1bnNoaWZ0cy5cclxuICAgICAgaWYgKGEgPSB4ZSAtIHllKSB7XHJcbiAgICAgICAgaWYgKGEgPiAwKSB7XHJcbiAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhID0gLWE7XHJcbiAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICBmb3IgKDsgYS0tOyB0LnB1c2goMCkpO1xyXG4gICAgICAgIHQucmV2ZXJzZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBhID0geGMubGVuZ3RoO1xyXG4gICAgICBiID0geWMubGVuZ3RoO1xyXG5cclxuICAgICAgLy8gUG9pbnQgeGMgdG8gdGhlIGxvbmdlciBhcnJheSwgYW5kIGIgdG8gdGhlIHNob3J0ZXIgbGVuZ3RoLlxyXG4gICAgICBpZiAoYSAtIGIgPCAwKSB0ID0geWMsIHljID0geGMsIHhjID0gdCwgYiA9IGE7XHJcblxyXG4gICAgICAvLyBPbmx5IHN0YXJ0IGFkZGluZyBhdCB5Yy5sZW5ndGggLSAxIGFzIHRoZSBmdXJ0aGVyIGRpZ2l0cyBvZiB4YyBjYW4gYmUgaWdub3JlZC5cclxuICAgICAgZm9yIChhID0gMDsgYjspIHtcclxuICAgICAgICBhID0gKHhjWy0tYl0gPSB4Y1tiXSArIHljW2JdICsgYSkgLyBCQVNFIHwgMDtcclxuICAgICAgICB4Y1tiXSA9IEJBU0UgPT09IHhjW2JdID8gMCA6IHhjW2JdICUgQkFTRTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGEpIHtcclxuICAgICAgICB4YyA9IFthXS5jb25jYXQoeGMpO1xyXG4gICAgICAgICsreWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIE5vIG5lZWQgdG8gY2hlY2sgZm9yIHplcm8sIGFzICt4ICsgK3kgIT0gMCAmJiAteCArIC15ICE9IDBcclxuICAgICAgLy8geWUgPSBNQVhfRVhQICsgMSBwb3NzaWJsZVxyXG4gICAgICByZXR1cm4gbm9ybWFsaXNlKHksIHhjLCB5ZSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogSWYgc2QgaXMgdW5kZWZpbmVkIG9yIG51bGwgb3IgdHJ1ZSBvciBmYWxzZSwgcmV0dXJuIHRoZSBudW1iZXIgb2Ygc2lnbmlmaWNhbnQgZGlnaXRzIG9mXHJcbiAgICAgKiB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIsIG9yIG51bGwgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGlzIMKxSW5maW5pdHkgb3IgTmFOLlxyXG4gICAgICogSWYgc2QgaXMgdHJ1ZSBpbmNsdWRlIGludGVnZXItcGFydCB0cmFpbGluZyB6ZXJvcyBpbiB0aGUgY291bnQuXHJcbiAgICAgKlxyXG4gICAgICogT3RoZXJ3aXNlLCBpZiBzZCBpcyBhIG51bWJlciwgcmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpc1xyXG4gICAgICogQmlnTnVtYmVyIHJvdW5kZWQgdG8gYSBtYXhpbXVtIG9mIHNkIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvclxyXG4gICAgICogUk9VTkRJTkdfTU9ERSBpZiBybSBpcyBvbWl0dGVkLlxyXG4gICAgICpcclxuICAgICAqIHNkIHtudW1iZXJ8Ym9vbGVhbn0gbnVtYmVyOiBzaWduaWZpY2FudCBkaWdpdHM6IGludGVnZXIsIDEgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgYm9vbGVhbjogd2hldGhlciB0byBjb3VudCBpbnRlZ2VyLXBhcnQgdHJhaWxpbmcgemVyb3M6IHRydWUgb3IgZmFsc2UuXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtzZHxybX0nXHJcbiAgICAgKi9cclxuICAgIFAucHJlY2lzaW9uID0gUC5zZCA9IGZ1bmN0aW9uIChzZCwgcm0pIHtcclxuICAgICAgdmFyIGMsIG4sIHYsXHJcbiAgICAgICAgeCA9IHRoaXM7XHJcblxyXG4gICAgICBpZiAoc2QgIT0gbnVsbCAmJiBzZCAhPT0gISFzZCkge1xyXG4gICAgICAgIGludENoZWNrKHNkLCAxLCBNQVgpO1xyXG4gICAgICAgIGlmIChybSA9PSBudWxsKSBybSA9IFJPVU5ESU5HX01PREU7XHJcbiAgICAgICAgZWxzZSBpbnRDaGVjayhybSwgMCwgOCk7XHJcblxyXG4gICAgICAgIHJldHVybiByb3VuZChuZXcgQmlnTnVtYmVyKHgpLCBzZCwgcm0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIShjID0geC5jKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgIHYgPSBjLmxlbmd0aCAtIDE7XHJcbiAgICAgIG4gPSB2ICogTE9HX0JBU0UgKyAxO1xyXG5cclxuICAgICAgaWYgKHYgPSBjW3ZdKSB7XHJcblxyXG4gICAgICAgIC8vIFN1YnRyYWN0IHRoZSBudW1iZXIgb2YgdHJhaWxpbmcgemVyb3Mgb2YgdGhlIGxhc3QgZWxlbWVudC5cclxuICAgICAgICBmb3IgKDsgdiAlIDEwID09IDA7IHYgLz0gMTAsIG4tLSk7XHJcblxyXG4gICAgICAgIC8vIEFkZCB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBvZiB0aGUgZmlyc3QgZWxlbWVudC5cclxuICAgICAgICBmb3IgKHYgPSBjWzBdOyB2ID49IDEwOyB2IC89IDEwLCBuKyspO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoc2QgJiYgeC5lICsgMSA+IG4pIG4gPSB4LmUgKyAxO1xyXG5cclxuICAgICAgcmV0dXJuIG47XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgc2hpZnRlZCBieSBrIHBsYWNlc1xyXG4gICAgICogKHBvd2VycyBvZiAxMCkuIFNoaWZ0IHRvIHRoZSByaWdodCBpZiBuID4gMCwgYW5kIHRvIHRoZSBsZWZ0IGlmIG4gPCAwLlxyXG4gICAgICpcclxuICAgICAqIGsge251bWJlcn0gSW50ZWdlciwgLU1BWF9TQUZFX0lOVEVHRVIgdG8gTUFYX1NBRkVfSU5URUdFUiBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtrfSdcclxuICAgICAqL1xyXG4gICAgUC5zaGlmdGVkQnkgPSBmdW5jdGlvbiAoaykge1xyXG4gICAgICBpbnRDaGVjayhrLCAtTUFYX1NBRkVfSU5URUdFUiwgTUFYX1NBRkVfSU5URUdFUik7XHJcbiAgICAgIHJldHVybiB0aGlzLnRpbWVzKCcxZScgKyBrKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiAgc3FydCgtbikgPSAgTlxyXG4gICAgICogIHNxcnQoTikgPSAgTlxyXG4gICAgICogIHNxcnQoLUkpID0gIE5cclxuICAgICAqICBzcXJ0KEkpID0gIElcclxuICAgICAqICBzcXJ0KDApID0gIDBcclxuICAgICAqICBzcXJ0KC0wKSA9IC0wXHJcbiAgICAgKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZ051bWJlciB3aG9zZSB2YWx1ZSBpcyB0aGUgc3F1YXJlIHJvb3Qgb2YgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyLFxyXG4gICAgICogcm91bmRlZCBhY2NvcmRpbmcgdG8gREVDSU1BTF9QTEFDRVMgYW5kIFJPVU5ESU5HX01PREUuXHJcbiAgICAgKi9cclxuICAgIFAuc3F1YXJlUm9vdCA9IFAuc3FydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIG0sIG4sIHIsIHJlcCwgdCxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICBjID0geC5jLFxyXG4gICAgICAgIHMgPSB4LnMsXHJcbiAgICAgICAgZSA9IHguZSxcclxuICAgICAgICBkcCA9IERFQ0lNQUxfUExBQ0VTICsgNCxcclxuICAgICAgICBoYWxmID0gbmV3IEJpZ051bWJlcignMC41Jyk7XHJcblxyXG4gICAgICAvLyBOZWdhdGl2ZS9OYU4vSW5maW5pdHkvemVybz9cclxuICAgICAgaWYgKHMgIT09IDEgfHwgIWMgfHwgIWNbMF0pIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJpZ051bWJlcighcyB8fCBzIDwgMCAmJiAoIWMgfHwgY1swXSkgPyBOYU4gOiBjID8geCA6IDEgLyAwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSW5pdGlhbCBlc3RpbWF0ZS5cclxuICAgICAgcyA9IE1hdGguc3FydCgrdmFsdWVPZih4KSk7XHJcblxyXG4gICAgICAvLyBNYXRoLnNxcnQgdW5kZXJmbG93L292ZXJmbG93P1xyXG4gICAgICAvLyBQYXNzIHggdG8gTWF0aC5zcXJ0IGFzIGludGVnZXIsIHRoZW4gYWRqdXN0IHRoZSBleHBvbmVudCBvZiB0aGUgcmVzdWx0LlxyXG4gICAgICBpZiAocyA9PSAwIHx8IHMgPT0gMSAvIDApIHtcclxuICAgICAgICBuID0gY29lZmZUb1N0cmluZyhjKTtcclxuICAgICAgICBpZiAoKG4ubGVuZ3RoICsgZSkgJSAyID09IDApIG4gKz0gJzAnO1xyXG4gICAgICAgIHMgPSBNYXRoLnNxcnQoK24pO1xyXG4gICAgICAgIGUgPSBiaXRGbG9vcigoZSArIDEpIC8gMikgLSAoZSA8IDAgfHwgZSAlIDIpO1xyXG5cclxuICAgICAgICBpZiAocyA9PSAxIC8gMCkge1xyXG4gICAgICAgICAgbiA9ICcxZScgKyBlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBuID0gcy50b0V4cG9uZW50aWFsKCk7XHJcbiAgICAgICAgICBuID0gbi5zbGljZSgwLCBuLmluZGV4T2YoJ2UnKSArIDEpICsgZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHIgPSBuZXcgQmlnTnVtYmVyKG4pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHIgPSBuZXcgQmlnTnVtYmVyKHMgKyAnJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENoZWNrIGZvciB6ZXJvLlxyXG4gICAgICAvLyByIGNvdWxkIGJlIHplcm8gaWYgTUlOX0VYUCBpcyBjaGFuZ2VkIGFmdGVyIHRoZSB0aGlzIHZhbHVlIHdhcyBjcmVhdGVkLlxyXG4gICAgICAvLyBUaGlzIHdvdWxkIGNhdXNlIGEgZGl2aXNpb24gYnkgemVybyAoeC90KSBhbmQgaGVuY2UgSW5maW5pdHkgYmVsb3csIHdoaWNoIHdvdWxkIGNhdXNlXHJcbiAgICAgIC8vIGNvZWZmVG9TdHJpbmcgdG8gdGhyb3cuXHJcbiAgICAgIGlmIChyLmNbMF0pIHtcclxuICAgICAgICBlID0gci5lO1xyXG4gICAgICAgIHMgPSBlICsgZHA7XHJcbiAgICAgICAgaWYgKHMgPCAzKSBzID0gMDtcclxuXHJcbiAgICAgICAgLy8gTmV3dG9uLVJhcGhzb24gaXRlcmF0aW9uLlxyXG4gICAgICAgIGZvciAoOyA7KSB7XHJcbiAgICAgICAgICB0ID0gcjtcclxuICAgICAgICAgIHIgPSBoYWxmLnRpbWVzKHQucGx1cyhkaXYoeCwgdCwgZHAsIDEpKSk7XHJcblxyXG4gICAgICAgICAgaWYgKGNvZWZmVG9TdHJpbmcodC5jKS5zbGljZSgwLCBzKSA9PT0gKG4gPSBjb2VmZlRvU3RyaW5nKHIuYykpLnNsaWNlKDAsIHMpKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBUaGUgZXhwb25lbnQgb2YgciBtYXkgaGVyZSBiZSBvbmUgbGVzcyB0aGFuIHRoZSBmaW5hbCByZXN1bHQgZXhwb25lbnQsXHJcbiAgICAgICAgICAgIC8vIGUuZyAwLjAwMDk5OTkgKGUtNCkgLS0+IDAuMDAxIChlLTMpLCBzbyBhZGp1c3QgcyBzbyB0aGUgcm91bmRpbmcgZGlnaXRzXHJcbiAgICAgICAgICAgIC8vIGFyZSBpbmRleGVkIGNvcnJlY3RseS5cclxuICAgICAgICAgICAgaWYgKHIuZSA8IGUpIC0tcztcclxuICAgICAgICAgICAgbiA9IG4uc2xpY2UocyAtIDMsIHMgKyAxKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZSA0dGggcm91bmRpbmcgZGlnaXQgbWF5IGJlIGluIGVycm9yIGJ5IC0xIHNvIGlmIHRoZSA0IHJvdW5kaW5nIGRpZ2l0c1xyXG4gICAgICAgICAgICAvLyBhcmUgOTk5OSBvciA0OTk5IChpLmUuIGFwcHJvYWNoaW5nIGEgcm91bmRpbmcgYm91bmRhcnkpIGNvbnRpbnVlIHRoZVxyXG4gICAgICAgICAgICAvLyBpdGVyYXRpb24uXHJcbiAgICAgICAgICAgIGlmIChuID09ICc5OTk5JyB8fCAhcmVwICYmIG4gPT0gJzQ5OTknKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIE9uIHRoZSBmaXJzdCBpdGVyYXRpb24gb25seSwgY2hlY2sgdG8gc2VlIGlmIHJvdW5kaW5nIHVwIGdpdmVzIHRoZVxyXG4gICAgICAgICAgICAgIC8vIGV4YWN0IHJlc3VsdCBhcyB0aGUgbmluZXMgbWF5IGluZmluaXRlbHkgcmVwZWF0LlxyXG4gICAgICAgICAgICAgIGlmICghcmVwKSB7XHJcbiAgICAgICAgICAgICAgICByb3VuZCh0LCB0LmUgKyBERUNJTUFMX1BMQUNFUyArIDIsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0LnRpbWVzKHQpLmVxKHgpKSB7XHJcbiAgICAgICAgICAgICAgICAgIHIgPSB0O1xyXG4gICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGRwICs9IDQ7XHJcbiAgICAgICAgICAgICAgcyArPSA0O1xyXG4gICAgICAgICAgICAgIHJlcCA9IDE7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIElmIHJvdW5kaW5nIGRpZ2l0cyBhcmUgbnVsbCwgMHswLDR9IG9yIDUwezAsM30sIGNoZWNrIGZvciBleGFjdFxyXG4gICAgICAgICAgICAgIC8vIHJlc3VsdC4gSWYgbm90LCB0aGVuIHRoZXJlIGFyZSBmdXJ0aGVyIGRpZ2l0cyBhbmQgbSB3aWxsIGJlIHRydXRoeS5cclxuICAgICAgICAgICAgICBpZiAoIStuIHx8ICErbi5zbGljZSgxKSAmJiBuLmNoYXJBdCgwKSA9PSAnNScpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUcnVuY2F0ZSB0byB0aGUgZmlyc3Qgcm91bmRpbmcgZGlnaXQuXHJcbiAgICAgICAgICAgICAgICByb3VuZChyLCByLmUgKyBERUNJTUFMX1BMQUNFUyArIDIsIDEpO1xyXG4gICAgICAgICAgICAgICAgbSA9ICFyLnRpbWVzKHIpLmVxKHgpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByb3VuZChyLCByLmUgKyBERUNJTUFMX1BMQUNFUyArIDEsIFJPVU5ESU5HX01PREUsIG0pO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGV4cG9uZW50aWFsIG5vdGF0aW9uIGFuZFxyXG4gICAgICogcm91bmRlZCB1c2luZyBST1VORElOR19NT0RFIHRvIGRwIGZpeGVkIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQge25vdCBhIHByaW1pdGl2ZSBudW1iZXJ8bm90IGFuIGludGVnZXJ8b3V0IG9mIHJhbmdlfToge2RwfHJtfSdcclxuICAgICAqL1xyXG4gICAgUC50b0V4cG9uZW50aWFsID0gZnVuY3Rpb24gKGRwLCBybSkge1xyXG4gICAgICBpZiAoZHAgIT0gbnVsbCkge1xyXG4gICAgICAgIGludENoZWNrKGRwLCAwLCBNQVgpO1xyXG4gICAgICAgIGRwKys7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZvcm1hdCh0aGlzLCBkcCwgcm0sIDEpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGluIGZpeGVkLXBvaW50IG5vdGF0aW9uIHJvdW5kaW5nXHJcbiAgICAgKiB0byBkcCBmaXhlZCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLCBvciBST1VORElOR19NT0RFIGlmIHJtIGlzIG9taXR0ZWQuXHJcbiAgICAgKlxyXG4gICAgICogTm90ZTogYXMgd2l0aCBKYXZhU2NyaXB0J3MgbnVtYmVyIHR5cGUsICgtMCkudG9GaXhlZCgwKSBpcyAnMCcsXHJcbiAgICAgKiBidXQgZS5nLiAoLTAuMDAwMDEpLnRvRml4ZWQoMCkgaXMgJy0wJy5cclxuICAgICAqXHJcbiAgICAgKiBbZHBdIHtudW1iZXJ9IERlY2ltYWwgcGxhY2VzLiBJbnRlZ2VyLCAwIHRvIE1BWCBpbmNsdXNpdmUuXHJcbiAgICAgKiBbcm1dIHtudW1iZXJ9IFJvdW5kaW5nIG1vZGUuIEludGVnZXIsIDAgdG8gOCBpbmNsdXNpdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtkcHxybX0nXHJcbiAgICAgKi9cclxuICAgIFAudG9GaXhlZCA9IGZ1bmN0aW9uIChkcCwgcm0pIHtcclxuICAgICAgaWYgKGRwICE9IG51bGwpIHtcclxuICAgICAgICBpbnRDaGVjayhkcCwgMCwgTUFYKTtcclxuICAgICAgICBkcCA9IGRwICsgdGhpcy5lICsgMTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZm9ybWF0KHRoaXMsIGRwLCBybSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWdOdW1iZXIgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24gcm91bmRlZFxyXG4gICAgICogdXNpbmcgcm0gb3IgUk9VTkRJTkdfTU9ERSB0byBkcCBkZWNpbWFsIHBsYWNlcywgYW5kIGZvcm1hdHRlZCBhY2NvcmRpbmcgdG8gdGhlIHByb3BlcnRpZXNcclxuICAgICAqIG9mIHRoZSBmb3JtYXQgb3IgRk9STUFUIG9iamVjdCAoc2VlIEJpZ051bWJlci5zZXQpLlxyXG4gICAgICpcclxuICAgICAqIFRoZSBmb3JtYXR0aW5nIG9iamVjdCBtYXkgY29udGFpbiBzb21lIG9yIGFsbCBvZiB0aGUgcHJvcGVydGllcyBzaG93biBiZWxvdy5cclxuICAgICAqXHJcbiAgICAgKiBGT1JNQVQgPSB7XHJcbiAgICAgKiAgIHByZWZpeDogJycsXHJcbiAgICAgKiAgIGdyb3VwU2l6ZTogMyxcclxuICAgICAqICAgc2Vjb25kYXJ5R3JvdXBTaXplOiAwLFxyXG4gICAgICogICBncm91cFNlcGFyYXRvcjogJywnLFxyXG4gICAgICogICBkZWNpbWFsU2VwYXJhdG9yOiAnLicsXHJcbiAgICAgKiAgIGZyYWN0aW9uR3JvdXBTaXplOiAwLFxyXG4gICAgICogICBmcmFjdGlvbkdyb3VwU2VwYXJhdG9yOiAnXFx4QTAnLCAgICAgIC8vIG5vbi1icmVha2luZyBzcGFjZVxyXG4gICAgICogICBzdWZmaXg6ICcnXHJcbiAgICAgKiB9O1xyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gRGVjaW1hbCBwbGFjZXMuIEludGVnZXIsIDAgdG8gTUFYIGluY2x1c2l2ZS5cclxuICAgICAqIFtybV0ge251bWJlcn0gUm91bmRpbmcgbW9kZS4gSW50ZWdlciwgMCB0byA4IGluY2x1c2l2ZS5cclxuICAgICAqIFtmb3JtYXRdIHtvYmplY3R9IEZvcm1hdHRpbmcgb3B0aW9ucy4gU2VlIEZPUk1BVCBwYmplY3QgYWJvdmUuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYSBwcmltaXRpdmUgbnVtYmVyfG5vdCBhbiBpbnRlZ2VyfG91dCBvZiByYW5nZX06IHtkcHxybX0nXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQXJndW1lbnQgbm90IGFuIG9iamVjdDoge2Zvcm1hdH0nXHJcbiAgICAgKi9cclxuICAgIFAudG9Gb3JtYXQgPSBmdW5jdGlvbiAoZHAsIHJtLCBmb3JtYXQpIHtcclxuICAgICAgdmFyIHN0cixcclxuICAgICAgICB4ID0gdGhpcztcclxuXHJcbiAgICAgIGlmIChmb3JtYXQgPT0gbnVsbCkge1xyXG4gICAgICAgIGlmIChkcCAhPSBudWxsICYmIHJtICYmIHR5cGVvZiBybSA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgZm9ybWF0ID0gcm07XHJcbiAgICAgICAgICBybSA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkcCAmJiB0eXBlb2YgZHAgPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgIGZvcm1hdCA9IGRwO1xyXG4gICAgICAgICAgZHAgPSBybSA9IG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGZvcm1hdCA9IEZPUk1BVDtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGZvcm1hdCAhPSAnb2JqZWN0Jykge1xyXG4gICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAoYmlnbnVtYmVyRXJyb3IgKyAnQXJndW1lbnQgbm90IGFuIG9iamVjdDogJyArIGZvcm1hdCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHN0ciA9IHgudG9GaXhlZChkcCwgcm0pO1xyXG5cclxuICAgICAgaWYgKHguYykge1xyXG4gICAgICAgIHZhciBpLFxyXG4gICAgICAgICAgYXJyID0gc3RyLnNwbGl0KCcuJyksXHJcbiAgICAgICAgICBnMSA9ICtmb3JtYXQuZ3JvdXBTaXplLFxyXG4gICAgICAgICAgZzIgPSArZm9ybWF0LnNlY29uZGFyeUdyb3VwU2l6ZSxcclxuICAgICAgICAgIGdyb3VwU2VwYXJhdG9yID0gZm9ybWF0Lmdyb3VwU2VwYXJhdG9yIHx8ICcnLFxyXG4gICAgICAgICAgaW50UGFydCA9IGFyclswXSxcclxuICAgICAgICAgIGZyYWN0aW9uUGFydCA9IGFyclsxXSxcclxuICAgICAgICAgIGlzTmVnID0geC5zIDwgMCxcclxuICAgICAgICAgIGludERpZ2l0cyA9IGlzTmVnID8gaW50UGFydC5zbGljZSgxKSA6IGludFBhcnQsXHJcbiAgICAgICAgICBsZW4gPSBpbnREaWdpdHMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoZzIpIGkgPSBnMSwgZzEgPSBnMiwgZzIgPSBpLCBsZW4gLT0gaTtcclxuXHJcbiAgICAgICAgaWYgKGcxID4gMCAmJiBsZW4gPiAwKSB7XHJcbiAgICAgICAgICBpID0gbGVuICUgZzEgfHwgZzE7XHJcbiAgICAgICAgICBpbnRQYXJ0ID0gaW50RGlnaXRzLnN1YnN0cigwLCBpKTtcclxuICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpICs9IGcxKSBpbnRQYXJ0ICs9IGdyb3VwU2VwYXJhdG9yICsgaW50RGlnaXRzLnN1YnN0cihpLCBnMSk7XHJcbiAgICAgICAgICBpZiAoZzIgPiAwKSBpbnRQYXJ0ICs9IGdyb3VwU2VwYXJhdG9yICsgaW50RGlnaXRzLnNsaWNlKGkpO1xyXG4gICAgICAgICAgaWYgKGlzTmVnKSBpbnRQYXJ0ID0gJy0nICsgaW50UGFydDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0ciA9IGZyYWN0aW9uUGFydFxyXG4gICAgICAgICA/IGludFBhcnQgKyAoZm9ybWF0LmRlY2ltYWxTZXBhcmF0b3IgfHwgJycpICsgKChnMiA9ICtmb3JtYXQuZnJhY3Rpb25Hcm91cFNpemUpXHJcbiAgICAgICAgICA/IGZyYWN0aW9uUGFydC5yZXBsYWNlKG5ldyBSZWdFeHAoJ1xcXFxkeycgKyBnMiArICd9XFxcXEInLCAnZycpLFxyXG4gICAgICAgICAgICckJicgKyAoZm9ybWF0LmZyYWN0aW9uR3JvdXBTZXBhcmF0b3IgfHwgJycpKVxyXG4gICAgICAgICAgOiBmcmFjdGlvblBhcnQpXHJcbiAgICAgICAgIDogaW50UGFydDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChmb3JtYXQucHJlZml4IHx8ICcnKSArIHN0ciArIChmb3JtYXQuc3VmZml4IHx8ICcnKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYW4gYXJyYXkgb2YgdHdvIEJpZ051bWJlcnMgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBhcyBhIHNpbXBsZVxyXG4gICAgICogZnJhY3Rpb24gd2l0aCBhbiBpbnRlZ2VyIG51bWVyYXRvciBhbmQgYW4gaW50ZWdlciBkZW5vbWluYXRvci5cclxuICAgICAqIFRoZSBkZW5vbWluYXRvciB3aWxsIGJlIGEgcG9zaXRpdmUgbm9uLXplcm8gdmFsdWUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSBzcGVjaWZpZWRcclxuICAgICAqIG1heGltdW0gZGVub21pbmF0b3IuIElmIGEgbWF4aW11bSBkZW5vbWluYXRvciBpcyBub3Qgc3BlY2lmaWVkLCB0aGUgZGVub21pbmF0b3Igd2lsbCBiZVxyXG4gICAgICogdGhlIGxvd2VzdCB2YWx1ZSBuZWNlc3NhcnkgdG8gcmVwcmVzZW50IHRoZSBudW1iZXIgZXhhY3RseS5cclxuICAgICAqXHJcbiAgICAgKiBbbWRdIHtudW1iZXJ8c3RyaW5nfEJpZ051bWJlcn0gSW50ZWdlciA+PSAxLCBvciBJbmZpbml0eS4gVGhlIG1heGltdW0gZGVub21pbmF0b3IuXHJcbiAgICAgKlxyXG4gICAgICogJ1tCaWdOdW1iZXIgRXJyb3JdIEFyZ3VtZW50IHtub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9IDoge21kfSdcclxuICAgICAqL1xyXG4gICAgUC50b0ZyYWN0aW9uID0gZnVuY3Rpb24gKG1kKSB7XHJcbiAgICAgIHZhciBkLCBkMCwgZDEsIGQyLCBlLCBleHAsIG4sIG4wLCBuMSwgcSwgciwgcyxcclxuICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICB4YyA9IHguYztcclxuXHJcbiAgICAgIGlmIChtZCAhPSBudWxsKSB7XHJcbiAgICAgICAgbiA9IG5ldyBCaWdOdW1iZXIobWQpO1xyXG5cclxuICAgICAgICAvLyBUaHJvdyBpZiBtZCBpcyBsZXNzIHRoYW4gb25lIG9yIGlzIG5vdCBhbiBpbnRlZ2VyLCB1bmxlc3MgaXQgaXMgSW5maW5pdHkuXHJcbiAgICAgICAgaWYgKCFuLmlzSW50ZWdlcigpICYmIChuLmMgfHwgbi5zICE9PSAxKSB8fCBuLmx0KE9ORSkpIHtcclxuICAgICAgICAgIHRocm93IEVycm9yXHJcbiAgICAgICAgICAgIChiaWdudW1iZXJFcnJvciArICdBcmd1bWVudCAnICtcclxuICAgICAgICAgICAgICAobi5pc0ludGVnZXIoKSA/ICdvdXQgb2YgcmFuZ2U6ICcgOiAnbm90IGFuIGludGVnZXI6ICcpICsgdmFsdWVPZihuKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXhjKSByZXR1cm4gbmV3IEJpZ051bWJlcih4KTtcclxuXHJcbiAgICAgIGQgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcbiAgICAgIG4xID0gZDAgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcbiAgICAgIGQxID0gbjAgPSBuZXcgQmlnTnVtYmVyKE9ORSk7XHJcbiAgICAgIHMgPSBjb2VmZlRvU3RyaW5nKHhjKTtcclxuXHJcbiAgICAgIC8vIERldGVybWluZSBpbml0aWFsIGRlbm9taW5hdG9yLlxyXG4gICAgICAvLyBkIGlzIGEgcG93ZXIgb2YgMTAgYW5kIHRoZSBtaW5pbXVtIG1heCBkZW5vbWluYXRvciB0aGF0IHNwZWNpZmllcyB0aGUgdmFsdWUgZXhhY3RseS5cclxuICAgICAgZSA9IGQuZSA9IHMubGVuZ3RoIC0geC5lIC0gMTtcclxuICAgICAgZC5jWzBdID0gUE9XU19URU5bKGV4cCA9IGUgJSBMT0dfQkFTRSkgPCAwID8gTE9HX0JBU0UgKyBleHAgOiBleHBdO1xyXG4gICAgICBtZCA9ICFtZCB8fCBuLmNvbXBhcmVkVG8oZCkgPiAwID8gKGUgPiAwID8gZCA6IG4xKSA6IG47XHJcblxyXG4gICAgICBleHAgPSBNQVhfRVhQO1xyXG4gICAgICBNQVhfRVhQID0gMSAvIDA7XHJcbiAgICAgIG4gPSBuZXcgQmlnTnVtYmVyKHMpO1xyXG5cclxuICAgICAgLy8gbjAgPSBkMSA9IDBcclxuICAgICAgbjAuY1swXSA9IDA7XHJcblxyXG4gICAgICBmb3IgKDsgOykgIHtcclxuICAgICAgICBxID0gZGl2KG4sIGQsIDAsIDEpO1xyXG4gICAgICAgIGQyID0gZDAucGx1cyhxLnRpbWVzKGQxKSk7XHJcbiAgICAgICAgaWYgKGQyLmNvbXBhcmVkVG8obWQpID09IDEpIGJyZWFrO1xyXG4gICAgICAgIGQwID0gZDE7XHJcbiAgICAgICAgZDEgPSBkMjtcclxuICAgICAgICBuMSA9IG4wLnBsdXMocS50aW1lcyhkMiA9IG4xKSk7XHJcbiAgICAgICAgbjAgPSBkMjtcclxuICAgICAgICBkID0gbi5taW51cyhxLnRpbWVzKGQyID0gZCkpO1xyXG4gICAgICAgIG4gPSBkMjtcclxuICAgICAgfVxyXG5cclxuICAgICAgZDIgPSBkaXYobWQubWludXMoZDApLCBkMSwgMCwgMSk7XHJcbiAgICAgIG4wID0gbjAucGx1cyhkMi50aW1lcyhuMSkpO1xyXG4gICAgICBkMCA9IGQwLnBsdXMoZDIudGltZXMoZDEpKTtcclxuICAgICAgbjAucyA9IG4xLnMgPSB4LnM7XHJcbiAgICAgIGUgPSBlICogMjtcclxuXHJcbiAgICAgIC8vIERldGVybWluZSB3aGljaCBmcmFjdGlvbiBpcyBjbG9zZXIgdG8geCwgbjAvZDAgb3IgbjEvZDFcclxuICAgICAgciA9IGRpdihuMSwgZDEsIGUsIFJPVU5ESU5HX01PREUpLm1pbnVzKHgpLmFicygpLmNvbXBhcmVkVG8oXHJcbiAgICAgICAgICBkaXYobjAsIGQwLCBlLCBST1VORElOR19NT0RFKS5taW51cyh4KS5hYnMoKSkgPCAxID8gW24xLCBkMV0gOiBbbjAsIGQwXTtcclxuXHJcbiAgICAgIE1BWF9FWFAgPSBleHA7XHJcblxyXG4gICAgICByZXR1cm4gcjtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdGhlIHZhbHVlIG9mIHRoaXMgQmlnTnVtYmVyIGNvbnZlcnRlZCB0byBhIG51bWJlciBwcmltaXRpdmUuXHJcbiAgICAgKi9cclxuICAgIFAudG9OdW1iZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiArdmFsdWVPZih0aGlzKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciByb3VuZGVkIHRvIHNkIHNpZ25pZmljYW50IGRpZ2l0c1xyXG4gICAgICogdXNpbmcgcm91bmRpbmcgbW9kZSBybSBvciBST1VORElOR19NT0RFLiBJZiBzZCBpcyBsZXNzIHRoYW4gdGhlIG51bWJlciBvZiBkaWdpdHNcclxuICAgICAqIG5lY2Vzc2FyeSB0byByZXByZXNlbnQgdGhlIGludGVnZXIgcGFydCBvZiB0aGUgdmFsdWUgaW4gZml4ZWQtcG9pbnQgbm90YXRpb24sIHRoZW4gdXNlXHJcbiAgICAgKiBleHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBbc2RdIHtudW1iZXJ9IFNpZ25pZmljYW50IGRpZ2l0cy4gSW50ZWdlciwgMSB0byBNQVggaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSB7bnVtYmVyfSBSb3VuZGluZyBtb2RlLiBJbnRlZ2VyLCAwIHRvIDggaW5jbHVzaXZlLlxyXG4gICAgICpcclxuICAgICAqICdbQmlnTnVtYmVyIEVycm9yXSBBcmd1bWVudCB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7c2R8cm19J1xyXG4gICAgICovXHJcbiAgICBQLnRvUHJlY2lzaW9uID0gZnVuY3Rpb24gKHNkLCBybSkge1xyXG4gICAgICBpZiAoc2QgIT0gbnVsbCkgaW50Q2hlY2soc2QsIDEsIE1BWCk7XHJcbiAgICAgIHJldHVybiBmb3JtYXQodGhpcywgc2QsIHJtLCAyKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZ051bWJlciBpbiBiYXNlIGIsIG9yIGJhc2UgMTAgaWYgYiBpc1xyXG4gICAgICogb21pdHRlZC4gSWYgYSBiYXNlIGlzIHNwZWNpZmllZCwgaW5jbHVkaW5nIGJhc2UgMTAsIHJvdW5kIGFjY29yZGluZyB0byBERUNJTUFMX1BMQUNFUyBhbmRcclxuICAgICAqIFJPVU5ESU5HX01PREUuIElmIGEgYmFzZSBpcyBub3Qgc3BlY2lmaWVkLCBhbmQgdGhpcyBCaWdOdW1iZXIgaGFzIGEgcG9zaXRpdmUgZXhwb25lbnRcclxuICAgICAqIHRoYXQgaXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFRPX0VYUF9QT1MsIG9yIGEgbmVnYXRpdmUgZXhwb25lbnQgZXF1YWwgdG8gb3IgbGVzcyB0aGFuXHJcbiAgICAgKiBUT19FWFBfTkVHLCByZXR1cm4gZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgKlxyXG4gICAgICogW2JdIHtudW1iZXJ9IEludGVnZXIsIDIgdG8gQUxQSEFCRVQubGVuZ3RoIGluY2x1c2l2ZS5cclxuICAgICAqXHJcbiAgICAgKiAnW0JpZ051bWJlciBFcnJvcl0gQmFzZSB7bm90IGEgcHJpbWl0aXZlIG51bWJlcnxub3QgYW4gaW50ZWdlcnxvdXQgb2YgcmFuZ2V9OiB7Yn0nXHJcbiAgICAgKi9cclxuICAgIFAudG9TdHJpbmcgPSBmdW5jdGlvbiAoYikge1xyXG4gICAgICB2YXIgc3RyLFxyXG4gICAgICAgIG4gPSB0aGlzLFxyXG4gICAgICAgIHMgPSBuLnMsXHJcbiAgICAgICAgZSA9IG4uZTtcclxuXHJcbiAgICAgIC8vIEluZmluaXR5IG9yIE5hTj9cclxuICAgICAgaWYgKGUgPT09IG51bGwpIHtcclxuICAgICAgICBpZiAocykge1xyXG4gICAgICAgICAgc3RyID0gJ0luZmluaXR5JztcclxuICAgICAgICAgIGlmIChzIDwgMCkgc3RyID0gJy0nICsgc3RyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzdHIgPSAnTmFOJztcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKGIgPT0gbnVsbCkge1xyXG4gICAgICAgICAgc3RyID0gZSA8PSBUT19FWFBfTkVHIHx8IGUgPj0gVE9fRVhQX1BPU1xyXG4gICAgICAgICAgID8gdG9FeHBvbmVudGlhbChjb2VmZlRvU3RyaW5nKG4uYyksIGUpXHJcbiAgICAgICAgICAgOiB0b0ZpeGVkUG9pbnQoY29lZmZUb1N0cmluZyhuLmMpLCBlLCAnMCcpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoYiA9PT0gMTApIHtcclxuICAgICAgICAgIG4gPSByb3VuZChuZXcgQmlnTnVtYmVyKG4pLCBERUNJTUFMX1BMQUNFUyArIGUgKyAxLCBST1VORElOR19NT0RFKTtcclxuICAgICAgICAgIHN0ciA9IHRvRml4ZWRQb2ludChjb2VmZlRvU3RyaW5nKG4uYyksIG4uZSwgJzAnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaW50Q2hlY2soYiwgMiwgQUxQSEFCRVQubGVuZ3RoLCAnQmFzZScpO1xyXG4gICAgICAgICAgc3RyID0gY29udmVydEJhc2UodG9GaXhlZFBvaW50KGNvZWZmVG9TdHJpbmcobi5jKSwgZSwgJzAnKSwgMTAsIGIsIHMsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHMgPCAwICYmIG4uY1swXSkgc3RyID0gJy0nICsgc3RyO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gc3RyO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhcyB0b1N0cmluZywgYnV0IGRvIG5vdCBhY2NlcHQgYSBiYXNlIGFyZ3VtZW50LCBhbmQgaW5jbHVkZSB0aGUgbWludXMgc2lnbiBmb3JcclxuICAgICAqIG5lZ2F0aXZlIHplcm8uXHJcbiAgICAgKi9cclxuICAgIFAudmFsdWVPZiA9IFAudG9KU09OID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gdmFsdWVPZih0aGlzKTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIFAuX2lzQmlnTnVtYmVyID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAoaGFzU3ltYm9sKSB7XHJcbiAgICAgIFBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdCaWdOdW1iZXInO1xyXG5cclxuICAgICAgLy8gTm9kZS5qcyB2MTAuMTIuMCtcclxuICAgICAgUFtTeW1ib2wuZm9yKCdub2RlanMudXRpbC5pbnNwZWN0LmN1c3RvbScpXSA9IFAudmFsdWVPZjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29uZmlnT2JqZWN0ICE9IG51bGwpIEJpZ051bWJlci5zZXQoY29uZmlnT2JqZWN0KTtcclxuXHJcbiAgICByZXR1cm4gQmlnTnVtYmVyO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIFBSSVZBVEUgSEVMUEVSIEZVTkNUSU9OU1xyXG5cclxuICAvLyBUaGVzZSBmdW5jdGlvbnMgZG9uJ3QgbmVlZCBhY2Nlc3MgdG8gdmFyaWFibGVzLFxyXG4gIC8vIGUuZy4gREVDSU1BTF9QTEFDRVMsIGluIHRoZSBzY29wZSBvZiB0aGUgYGNsb25lYCBmdW5jdGlvbiBhYm92ZS5cclxuXHJcblxyXG4gIGZ1bmN0aW9uIGJpdEZsb29yKG4pIHtcclxuICAgIHZhciBpID0gbiB8IDA7XHJcbiAgICByZXR1cm4gbiA+IDAgfHwgbiA9PT0gaSA/IGkgOiBpIC0gMTtcclxuICB9XHJcblxyXG5cclxuICAvLyBSZXR1cm4gYSBjb2VmZmljaWVudCBhcnJheSBhcyBhIHN0cmluZyBvZiBiYXNlIDEwIGRpZ2l0cy5cclxuICBmdW5jdGlvbiBjb2VmZlRvU3RyaW5nKGEpIHtcclxuICAgIHZhciBzLCB6LFxyXG4gICAgICBpID0gMSxcclxuICAgICAgaiA9IGEubGVuZ3RoLFxyXG4gICAgICByID0gYVswXSArICcnO1xyXG5cclxuICAgIGZvciAoOyBpIDwgajspIHtcclxuICAgICAgcyA9IGFbaSsrXSArICcnO1xyXG4gICAgICB6ID0gTE9HX0JBU0UgLSBzLmxlbmd0aDtcclxuICAgICAgZm9yICg7IHotLTsgcyA9ICcwJyArIHMpO1xyXG4gICAgICByICs9IHM7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgZm9yIChqID0gci5sZW5ndGg7IHIuY2hhckNvZGVBdCgtLWopID09PSA0ODspO1xyXG5cclxuICAgIHJldHVybiByLnNsaWNlKDAsIGogKyAxIHx8IDEpO1xyXG4gIH1cclxuXHJcblxyXG4gIC8vIENvbXBhcmUgdGhlIHZhbHVlIG9mIEJpZ051bWJlcnMgeCBhbmQgeS5cclxuICBmdW5jdGlvbiBjb21wYXJlKHgsIHkpIHtcclxuICAgIHZhciBhLCBiLFxyXG4gICAgICB4YyA9IHguYyxcclxuICAgICAgeWMgPSB5LmMsXHJcbiAgICAgIGkgPSB4LnMsXHJcbiAgICAgIGogPSB5LnMsXHJcbiAgICAgIGsgPSB4LmUsXHJcbiAgICAgIGwgPSB5LmU7XHJcblxyXG4gICAgLy8gRWl0aGVyIE5hTj9cclxuICAgIGlmICghaSB8fCAhaikgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgYSA9IHhjICYmICF4Y1swXTtcclxuICAgIGIgPSB5YyAmJiAheWNbMF07XHJcblxyXG4gICAgLy8gRWl0aGVyIHplcm8/XHJcbiAgICBpZiAoYSB8fCBiKSByZXR1cm4gYSA/IGIgPyAwIDogLWogOiBpO1xyXG5cclxuICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgIGlmIChpICE9IGopIHJldHVybiBpO1xyXG5cclxuICAgIGEgPSBpIDwgMDtcclxuICAgIGIgPSBrID09IGw7XHJcblxyXG4gICAgLy8gRWl0aGVyIEluZmluaXR5P1xyXG4gICAgaWYgKCF4YyB8fCAheWMpIHJldHVybiBiID8gMCA6ICF4YyBeIGEgPyAxIDogLTE7XHJcblxyXG4gICAgLy8gQ29tcGFyZSBleHBvbmVudHMuXHJcbiAgICBpZiAoIWIpIHJldHVybiBrID4gbCBeIGEgPyAxIDogLTE7XHJcblxyXG4gICAgaiA9IChrID0geGMubGVuZ3RoKSA8IChsID0geWMubGVuZ3RoKSA/IGsgOiBsO1xyXG5cclxuICAgIC8vIENvbXBhcmUgZGlnaXQgYnkgZGlnaXQuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgajsgaSsrKSBpZiAoeGNbaV0gIT0geWNbaV0pIHJldHVybiB4Y1tpXSA+IHljW2ldIF4gYSA/IDEgOiAtMTtcclxuXHJcbiAgICAvLyBDb21wYXJlIGxlbmd0aHMuXHJcbiAgICByZXR1cm4gayA9PSBsID8gMCA6IGsgPiBsIF4gYSA/IDEgOiAtMTtcclxuICB9XHJcblxyXG5cclxuICAvKlxyXG4gICAqIENoZWNrIHRoYXQgbiBpcyBhIHByaW1pdGl2ZSBudW1iZXIsIGFuIGludGVnZXIsIGFuZCBpbiByYW5nZSwgb3RoZXJ3aXNlIHRocm93LlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGludENoZWNrKG4sIG1pbiwgbWF4LCBuYW1lKSB7XHJcbiAgICBpZiAobiA8IG1pbiB8fCBuID4gbWF4IHx8IG4gIT09IG1hdGhmbG9vcihuKSkge1xyXG4gICAgICB0aHJvdyBFcnJvclxyXG4gICAgICAgKGJpZ251bWJlckVycm9yICsgKG5hbWUgfHwgJ0FyZ3VtZW50JykgKyAodHlwZW9mIG4gPT0gJ251bWJlcidcclxuICAgICAgICAgPyBuIDwgbWluIHx8IG4gPiBtYXggPyAnIG91dCBvZiByYW5nZTogJyA6ICcgbm90IGFuIGludGVnZXI6ICdcclxuICAgICAgICAgOiAnIG5vdCBhIHByaW1pdGl2ZSBudW1iZXI6ICcpICsgU3RyaW5nKG4pKTtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICAvLyBBc3N1bWVzIGZpbml0ZSBuLlxyXG4gIGZ1bmN0aW9uIGlzT2RkKG4pIHtcclxuICAgIHZhciBrID0gbi5jLmxlbmd0aCAtIDE7XHJcbiAgICByZXR1cm4gYml0Rmxvb3Iobi5lIC8gTE9HX0JBU0UpID09IGsgJiYgbi5jW2tdICUgMiAhPSAwO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIHRvRXhwb25lbnRpYWwoc3RyLCBlKSB7XHJcbiAgICByZXR1cm4gKHN0ci5sZW5ndGggPiAxID8gc3RyLmNoYXJBdCgwKSArICcuJyArIHN0ci5zbGljZSgxKSA6IHN0cikgK1xyXG4gICAgIChlIDwgMCA/ICdlJyA6ICdlKycpICsgZTtcclxuICB9XHJcblxyXG5cclxuICBmdW5jdGlvbiB0b0ZpeGVkUG9pbnQoc3RyLCBlLCB6KSB7XHJcbiAgICB2YXIgbGVuLCB6cztcclxuXHJcbiAgICAvLyBOZWdhdGl2ZSBleHBvbmVudD9cclxuICAgIGlmIChlIDwgMCkge1xyXG5cclxuICAgICAgLy8gUHJlcGVuZCB6ZXJvcy5cclxuICAgICAgZm9yICh6cyA9IHogKyAnLic7ICsrZTsgenMgKz0geik7XHJcbiAgICAgIHN0ciA9IHpzICsgc3RyO1xyXG5cclxuICAgIC8vIFBvc2l0aXZlIGV4cG9uZW50XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsZW4gPSBzdHIubGVuZ3RoO1xyXG5cclxuICAgICAgLy8gQXBwZW5kIHplcm9zLlxyXG4gICAgICBpZiAoKytlID4gbGVuKSB7XHJcbiAgICAgICAgZm9yICh6cyA9IHosIGUgLT0gbGVuOyAtLWU7IHpzICs9IHopO1xyXG4gICAgICAgIHN0ciArPSB6cztcclxuICAgICAgfSBlbHNlIGlmIChlIDwgbGVuKSB7XHJcbiAgICAgICAgc3RyID0gc3RyLnNsaWNlKDAsIGUpICsgJy4nICsgc3RyLnNsaWNlKGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN0cjtcclxuICB9XHJcblxyXG5cclxuICAvLyBFWFBPUlRcclxuXHJcblxyXG4gIEJpZ051bWJlciA9IGNsb25lKCk7XHJcbiAgQmlnTnVtYmVyWydkZWZhdWx0J10gPSBCaWdOdW1iZXIuQmlnTnVtYmVyID0gQmlnTnVtYmVyO1xyXG5cclxuICAvLyBBTUQuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICBkZWZpbmUoZnVuY3Rpb24gKCkgeyByZXR1cm4gQmlnTnVtYmVyOyB9KTtcclxuXHJcbiAgLy8gTm9kZS5qcyBhbmQgb3RoZXIgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cy5cclxuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gQmlnTnVtYmVyO1xyXG5cclxuICAvLyBCcm93c2VyLlxyXG4gIH0gZWxzZSB7XHJcbiAgICBpZiAoIWdsb2JhbE9iamVjdCkge1xyXG4gICAgICBnbG9iYWxPYmplY3QgPSB0eXBlb2Ygc2VsZiAhPSAndW5kZWZpbmVkJyAmJiBzZWxmID8gc2VsZiA6IHdpbmRvdztcclxuICAgIH1cclxuXHJcbiAgICBnbG9iYWxPYmplY3QuQmlnTnVtYmVyID0gQmlnTnVtYmVyO1xyXG4gIH1cclxufSkodGhpcyk7XHJcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3IEJlbmphbWluIFZhbiBSeXNlZ2hlbTxiZW5qYW1pbkB2YW5yeXNlZ2hlbS5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsYW5ndWFnZVRhZzogXCJlbi1VU1wiLFxuICAgIGRlbGltaXRlcnM6IHtcbiAgICAgICAgdGhvdXNhbmRzOiBcIixcIixcbiAgICAgICAgZGVjaW1hbDogXCIuXCJcbiAgICB9LFxuICAgIGFiYnJldmlhdGlvbnM6IHtcbiAgICAgICAgdGhvdXNhbmQ6IFwia1wiLFxuICAgICAgICBtaWxsaW9uOiBcIm1cIixcbiAgICAgICAgYmlsbGlvbjogXCJiXCIsXG4gICAgICAgIHRyaWxsaW9uOiBcInRcIlxuICAgIH0sXG4gICAgc3BhY2VTZXBhcmF0ZWQ6IGZhbHNlLFxuICAgIG9yZGluYWw6IGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgICBsZXQgYiA9IG51bWJlciAlIDEwO1xuICAgICAgICByZXR1cm4gKH5+KG51bWJlciAlIDEwMCAvIDEwKSA9PT0gMSkgPyBcInRoXCIgOiAoYiA9PT0gMSkgPyBcInN0XCIgOiAoYiA9PT0gMikgPyBcIm5kXCIgOiAoYiA9PT0gMykgPyBcInJkXCIgOiBcInRoXCI7XG4gICAgfSxcbiAgICBieXRlczoge1xuICAgICAgICBiaW5hcnlTdWZmaXhlczogW1wiQlwiLCBcIktpQlwiLCBcIk1pQlwiLCBcIkdpQlwiLCBcIlRpQlwiLCBcIlBpQlwiLCBcIkVpQlwiLCBcIlppQlwiLCBcIllpQlwiXSxcbiAgICAgICAgZGVjaW1hbFN1ZmZpeGVzOiBbXCJCXCIsIFwiS0JcIiwgXCJNQlwiLCBcIkdCXCIsIFwiVEJcIiwgXCJQQlwiLCBcIkVCXCIsIFwiWkJcIiwgXCJZQlwiXVxuICAgIH0sXG4gICAgY3VycmVuY3k6IHtcbiAgICAgICAgc3ltYm9sOiBcIiRcIixcbiAgICAgICAgcG9zaXRpb246IFwicHJlZml4XCIsXG4gICAgICAgIGNvZGU6IFwiVVNEXCJcbiAgICB9LFxuICAgIGN1cnJlbmN5Rm9ybWF0OiB7XG4gICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICB0b3RhbExlbmd0aDogNCxcbiAgICAgICAgc3BhY2VTZXBhcmF0ZWQ6IHRydWUsXG4gICAgICAgIHNwYWNlU2VwYXJhdGVkQ3VycmVuY3k6IHRydWVcbiAgICB9LFxuICAgIGZvcm1hdHM6IHtcbiAgICAgICAgZm91ckRpZ2l0czoge1xuICAgICAgICAgICAgdG90YWxMZW5ndGg6IDQsXG4gICAgICAgICAgICBzcGFjZVNlcGFyYXRlZDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBmdWxsV2l0aFR3b0RlY2ltYWxzOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IFwiY3VycmVuY3lcIixcbiAgICAgICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICAgICAgbWFudGlzc2E6IDJcbiAgICAgICAgfSxcbiAgICAgICAgZnVsbFdpdGhUd29EZWNpbWFsc05vQ3VycmVuY3k6IHtcbiAgICAgICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICAgICAgbWFudGlzc2E6IDJcbiAgICAgICAgfSxcbiAgICAgICAgZnVsbFdpdGhOb0RlY2ltYWxzOiB7XG4gICAgICAgICAgICBvdXRwdXQ6IFwiY3VycmVuY3lcIixcbiAgICAgICAgICAgIHRob3VzYW5kU2VwYXJhdGVkOiB0cnVlLFxuICAgICAgICAgICAgbWFudGlzc2E6IDBcbiAgICAgICAgfVxuICAgIH1cbn07XG4iLCIvKiFcbiAqIENvcHlyaWdodCAoYykgMjAxNyBCZW5qYW1pbiBWYW4gUnlzZWdoZW08YmVuamFtaW5AdmFucnlzZWdoZW0uY29tPlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuY29uc3QgZ2xvYmFsU3RhdGUgPSByZXF1aXJlKFwiLi9nbG9iYWxTdGF0ZVwiKTtcbmNvbnN0IHZhbGlkYXRpbmcgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmNvbnN0IHBvd2VycyA9IHtcbiAgICB0cmlsbGlvbjogTWF0aC5wb3coMTAsIDEyKSxcbiAgICBiaWxsaW9uOiBNYXRoLnBvdygxMCwgOSksXG4gICAgbWlsbGlvbjogTWF0aC5wb3coMTAsIDYpLFxuICAgIHRob3VzYW5kOiBNYXRoLnBvdygxMCwgMylcbn07XG5cbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgIHRvdGFsTGVuZ3RoOiAwLFxuICAgIGNoYXJhY3RlcmlzdGljOiAwLFxuICAgIGZvcmNlQXZlcmFnZTogZmFsc2UsXG4gICAgYXZlcmFnZTogZmFsc2UsXG4gICAgbWFudGlzc2E6IC0xLFxuICAgIG9wdGlvbmFsTWFudGlzc2E6IHRydWUsXG4gICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IGZhbHNlLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBmYWxzZSxcbiAgICBuZWdhdGl2ZTogXCJzaWduXCIsXG4gICAgZm9yY2VTaWduOiBmYWxzZSxcbiAgICByb3VuZGluZ0Z1bmN0aW9uOiBNYXRoLnJvdW5kLFxuICAgIHNwYWNlU2VwYXJhdGVkQWJicmV2aWF0aW9uOiBmYWxzZVxufTtcblxuY29uc3QgeyBiaW5hcnlTdWZmaXhlcywgZGVjaW1hbFN1ZmZpeGVzIH0gPSBnbG9iYWxTdGF0ZS5jdXJyZW50Qnl0ZXMoKTtcblxuY29uc3QgYnl0ZXMgPSB7XG4gICAgZ2VuZXJhbDogeyBzY2FsZTogMTAyNCwgc3VmZml4ZXM6IGRlY2ltYWxTdWZmaXhlcywgbWFya2VyOiBcImJkXCIgfSxcbiAgICBiaW5hcnk6IHsgc2NhbGU6IDEwMjQsIHN1ZmZpeGVzOiBiaW5hcnlTdWZmaXhlcywgbWFya2VyOiBcImJcIiB9LFxuICAgIGRlY2ltYWw6IHsgc2NhbGU6IDEwMDAsIHN1ZmZpeGVzOiBkZWNpbWFsU3VmZml4ZXMsIG1hcmtlcjogXCJkXCIgfVxufTtcblxuLyoqXG4gKiBFbnRyeSBwb2ludC4gRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhY2NvcmRpbmcgdG8gdGhlIFBST1ZJREVERk9STUFULlxuICogVGhpcyBtZXRob2QgZW5zdXJlIHRoZSBwcmVmaXggYW5kIHBvc3RmaXggYXJlIGFkZGVkIGFzIHRoZSBsYXN0IHN0ZXAuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR8c3RyaW5nfSBbcHJvdmlkZWRGb3JtYXRdIC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIG51bWJybyAtIHRoZSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdChpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQgPSB7fSwgbnVtYnJvKSB7XG4gICAgaWYgKHR5cGVvZiBwcm92aWRlZEZvcm1hdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBwcm92aWRlZEZvcm1hdCA9IHBhcnNpbmcucGFyc2VGb3JtYXQocHJvdmlkZWRGb3JtYXQpO1xuICAgIH1cblxuICAgIGxldCB2YWxpZCA9IHZhbGlkYXRpbmcudmFsaWRhdGVGb3JtYXQocHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgaWYgKCF2YWxpZCkge1xuICAgICAgICByZXR1cm4gXCJFUlJPUjogaW52YWxpZCBmb3JtYXRcIjtcbiAgICB9XG5cbiAgICBsZXQgcHJlZml4ID0gcHJvdmlkZWRGb3JtYXQucHJlZml4IHx8IFwiXCI7XG4gICAgbGV0IHBvc3RmaXggPSBwcm92aWRlZEZvcm1hdC5wb3N0Zml4IHx8IFwiXCI7XG5cbiAgICBsZXQgb3V0cHV0ID0gZm9ybWF0TnVtYnJvKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgbnVtYnJvKTtcbiAgICBvdXRwdXQgPSBpbnNlcnRQcmVmaXgob3V0cHV0LCBwcmVmaXgpO1xuICAgIG91dHB1dCA9IGluc2VydFBvc3RmaXgob3V0cHV0LCBwb3N0Zml4KTtcbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYWNjb3JkaW5nIHRvIHRoZSBQUk9WSURFREZPUk1BVC5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXROdW1icm8oaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBudW1icm8pIHtcbiAgICBzd2l0Y2ggKHByb3ZpZGVkRm9ybWF0Lm91dHB1dCkge1xuICAgICAgICBjYXNlIFwiY3VycmVuY3lcIjoge1xuICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBmb3JtYXRPckRlZmF1bHQocHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLmN1cnJlbnRDdXJyZW5jeURlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0Q3VycmVuY3koaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwicGVyY2VudFwiOiB7XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudFBlcmNlbnRhZ2VEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdFBlcmNlbnRhZ2UoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYnl0ZVwiOlxuICAgICAgICAgICAgcHJvdmlkZWRGb3JtYXQgPSBmb3JtYXRPckRlZmF1bHQocHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLmN1cnJlbnRCeXRlRGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRCeXRlKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUsIG51bWJybyk7XG4gICAgICAgIGNhc2UgXCJ0aW1lXCI6XG4gICAgICAgICAgICBwcm92aWRlZEZvcm1hdCA9IGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudFRpbWVEZWZhdWx0Rm9ybWF0KCkpO1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdFRpbWUoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZSwgbnVtYnJvKTtcbiAgICAgICAgY2FzZSBcIm9yZGluYWxcIjpcbiAgICAgICAgICAgIHByb3ZpZGVkRm9ybWF0ID0gZm9ybWF0T3JEZWZhdWx0KHByb3ZpZGVkRm9ybWF0LCBnbG9iYWxTdGF0ZS5jdXJyZW50T3JkaW5hbERlZmF1bHRGb3JtYXQoKSk7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0T3JkaW5hbChpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIGdsb2JhbFN0YXRlLCBudW1icm8pO1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0TnVtYmVyKHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgICAgICAgICBudW1icm9cbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBHZXQgdGhlIGRlY2ltYWwgYnl0ZSB1bml0IChNQikgZm9yIHRoZSBwcm92aWRlZCBudW1icm8gSU5TVEFOQ0UuXG4gKiBXZSBnbyBmcm9tIG9uZSB1bml0IHRvIGFub3RoZXIgdXNpbmcgdGhlIGRlY2ltYWwgc3lzdGVtICgxMDAwKS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gY29tcHV0ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBnZXREZWNpbWFsQnl0ZVVuaXQoaW5zdGFuY2UpIHtcbiAgICBsZXQgZGF0YSA9IGJ5dGVzLmRlY2ltYWw7XG4gICAgcmV0dXJuIGdldEZvcm1hdEJ5dGVVbml0cyhpbnN0YW5jZS5fdmFsdWUsIGRhdGEuc3VmZml4ZXMsIGRhdGEuc2NhbGUpLnN1ZmZpeDtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGJpbmFyeSBieXRlIHVuaXQgKE1pQikgZm9yIHRoZSBwcm92aWRlZCBudW1icm8gSU5TVEFOQ0UuXG4gKiBXZSBnbyBmcm9tIG9uZSB1bml0IHRvIGFub3RoZXIgdXNpbmcgdGhlIGRlY2ltYWwgc3lzdGVtICgxMDI0KS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gY29tcHV0ZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBnZXRCaW5hcnlCeXRlVW5pdChpbnN0YW5jZSkge1xuICAgIGxldCBkYXRhID0gYnl0ZXMuYmluYXJ5O1xuICAgIHJldHVybiBnZXRGb3JtYXRCeXRlVW5pdHMoaW5zdGFuY2UuX3ZhbHVlLCBkYXRhLnN1ZmZpeGVzLCBkYXRhLnNjYWxlKS5zdWZmaXg7XG59XG5cbi8qKlxuICogR2V0IHRoZSBkZWNpbWFsIGJ5dGUgdW5pdCAoTUIpIGZvciB0aGUgcHJvdmlkZWQgbnVtYnJvIElOU1RBTkNFLlxuICogV2UgZ28gZnJvbSBvbmUgdW5pdCB0byBhbm90aGVyIHVzaW5nIHRoZSBkZWNpbWFsIHN5c3RlbSAoMTAyNCkuXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGNvbXB1dGVcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZ2V0Qnl0ZVVuaXQoaW5zdGFuY2UpIHtcbiAgICBsZXQgZGF0YSA9IGJ5dGVzLmdlbmVyYWw7XG4gICAgcmV0dXJuIGdldEZvcm1hdEJ5dGVVbml0cyhpbnN0YW5jZS5fdmFsdWUsIGRhdGEuc3VmZml4ZXMsIGRhdGEuc2NhbGUpLnN1ZmZpeDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIHZhbHVlIGFuZCB0aGUgc3VmZml4IGNvbXB1dGVkIGluIGJ5dGUuXG4gKiBJdCB1c2VzIHRoZSBTVUZGSVhFUyBhbmQgdGhlIFNDQUxFIHByb3ZpZGVkLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIE51bWJlciB0byBmb3JtYXRcbiAqIEBwYXJhbSB7W1N0cmluZ119IHN1ZmZpeGVzIC0gTGlzdCBvZiBzdWZmaXhlc1xuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxlIC0gTnVtYmVyIGluLWJldHdlZW4gdHdvIHVuaXRzXG4gKiBAcmV0dXJuIHt7dmFsdWU6IE51bWJlciwgc3VmZml4OiBTdHJpbmd9fVxuICovXG5mdW5jdGlvbiBnZXRGb3JtYXRCeXRlVW5pdHModmFsdWUsIHN1ZmZpeGVzLCBzY2FsZSkge1xuICAgIGxldCBzdWZmaXggPSBzdWZmaXhlc1swXTtcbiAgICBsZXQgYWJzID0gTWF0aC5hYnModmFsdWUpO1xuXG4gICAgaWYgKGFicyA+PSBzY2FsZSkge1xuICAgICAgICBmb3IgKGxldCBwb3dlciA9IDE7IHBvd2VyIDwgc3VmZml4ZXMubGVuZ3RoOyArK3Bvd2VyKSB7XG4gICAgICAgICAgICBsZXQgbWluID0gTWF0aC5wb3coc2NhbGUsIHBvd2VyKTtcbiAgICAgICAgICAgIGxldCBtYXggPSBNYXRoLnBvdyhzY2FsZSwgcG93ZXIgKyAxKTtcblxuICAgICAgICAgICAgaWYgKGFicyA+PSBtaW4gJiYgYWJzIDwgbWF4KSB7XG4gICAgICAgICAgICAgICAgc3VmZml4ID0gc3VmZml4ZXNbcG93ZXJdO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBtaW47XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWx1ZXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIFtzY2FsZV0gWUIgbmV2ZXIgc2V0IHRoZSBzdWZmaXhcbiAgICAgICAgaWYgKHN1ZmZpeCA9PT0gc3VmZml4ZXNbMF0pIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBNYXRoLnBvdyhzY2FsZSwgc3VmZml4ZXMubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICBzdWZmaXggPSBzdWZmaXhlc1tzdWZmaXhlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IHZhbHVlLCBzdWZmaXggfTtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGJ5dGVzIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCwgYW5kIFNUQVRFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IHByb3ZpZGVkRm9ybWF0IC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtnbG9iYWxTdGF0ZX0gc3RhdGUgLSBzaGFyZWQgc3RhdGUgb2YgdGhlIGxpYnJhcnlcbiAqIEBwYXJhbSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmb3JtYXRCeXRlKGluc3RhbmNlLCBwcm92aWRlZEZvcm1hdCwgc3RhdGUsIG51bWJybykge1xuICAgIGxldCBiYXNlID0gcHJvdmlkZWRGb3JtYXQuYmFzZSB8fCBcImJpbmFyeVwiO1xuICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHByb3ZpZGVkRm9ybWF0KTtcblxuICAgIGNvbnN0IHsgYmluYXJ5U3VmZml4ZXM6IGxvY2FsQmluYXJ5U3VmZml4ZXMsIGRlY2ltYWxTdWZmaXhlczogbG9jYWxEZWNpbWFsU3VmZml4ZXMgfSA9IHN0YXRlLmN1cnJlbnRCeXRlcygpO1xuXG4gICAgY29uc3QgbG9jYWxCeXRlcyA9IHtcbiAgICAgICAgZ2VuZXJhbDogeyBzY2FsZTogMTAyNCwgc3VmZml4ZXM6IGxvY2FsRGVjaW1hbFN1ZmZpeGVzIHx8IGRlY2ltYWxTdWZmaXhlcywgbWFya2VyOiBcImJkXCIgfSxcbiAgICAgICAgYmluYXJ5OiB7IHNjYWxlOiAxMDI0LCBzdWZmaXhlczogbG9jYWxCaW5hcnlTdWZmaXhlcyB8fCBiaW5hcnlTdWZmaXhlcywgbWFya2VyOiBcImJcIiB9LFxuICAgICAgICBkZWNpbWFsOiB7IHNjYWxlOiAxMDAwLCBzdWZmaXhlczogbG9jYWxEZWNpbWFsU3VmZml4ZXMgfHwgZGVjaW1hbFN1ZmZpeGVzLCBtYXJrZXI6IFwiZFwiIH1cbiAgICB9O1xuICAgIGxldCBiYXNlSW5mbyA9IGxvY2FsQnl0ZXNbYmFzZV07XG5cbiAgICBsZXQgeyB2YWx1ZSwgc3VmZml4IH0gPSBnZXRGb3JtYXRCeXRlVW5pdHMoaW5zdGFuY2UuX3ZhbHVlLCBiYXNlSW5mby5zdWZmaXhlcywgYmFzZUluZm8uc2NhbGUpO1xuXG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJlcih7XG4gICAgICAgIGluc3RhbmNlOiBudW1icm8odmFsdWUpLFxuICAgICAgICBwcm92aWRlZEZvcm1hdCxcbiAgICAgICAgc3RhdGUsXG4gICAgICAgIGRlZmF1bHRzOiBzdGF0ZS5jdXJyZW50Qnl0ZURlZmF1bHRGb3JtYXQoKVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGAke291dHB1dH0ke29wdGlvbnMuc3BhY2VTZXBhcmF0ZWQgPyBcIiBcIiA6IFwiXCJ9JHtzdWZmaXh9YDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGFuIG9yZGluYWwgdXNpbmcgdGhlIFBST1ZJREVERk9STUFULFxuICogYW5kIHRoZSBTVEFURS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE9yZGluYWwoaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSkge1xuICAgIGxldCBvcmRpbmFsRm4gPSBzdGF0ZS5jdXJyZW50T3JkaW5hbCgpO1xuICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHByb3ZpZGVkRm9ybWF0KTtcblxuICAgIGxldCBvdXRwdXQgPSBmb3JtYXROdW1iZXIoe1xuICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgcHJvdmlkZWRGb3JtYXQsXG4gICAgICAgIHN0YXRlXG4gICAgfSk7XG4gICAgbGV0IG9yZGluYWwgPSBvcmRpbmFsRm4oaW5zdGFuY2UuX3ZhbHVlKTtcblxuICAgIHJldHVybiBgJHtvdXRwdXR9JHtvcHRpb25zLnNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwifSR7b3JkaW5hbH1gO1xufVxuXG4vKipcbiAqIEZvcm1hdCB0aGUgcHJvdmlkZWQgSU5TVEFOQ0UgYXMgYSB0aW1lIEhIOk1NOlNTLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0VGltZShpbnN0YW5jZSkge1xuICAgIGxldCBob3VycyA9IE1hdGguZmxvb3IoaW5zdGFuY2UuX3ZhbHVlIC8gNjAgLyA2MCk7XG4gICAgbGV0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKChpbnN0YW5jZS5fdmFsdWUgLSAoaG91cnMgKiA2MCAqIDYwKSkgLyA2MCk7XG4gICAgbGV0IHNlY29uZHMgPSBNYXRoLnJvdW5kKGluc3RhbmNlLl92YWx1ZSAtIChob3VycyAqIDYwICogNjApIC0gKG1pbnV0ZXMgKiA2MCkpO1xuICAgIHJldHVybiBgJHtob3Vyc306JHsobWludXRlcyA8IDEwKSA/IFwiMFwiIDogXCJcIn0ke21pbnV0ZXN9OiR7KHNlY29uZHMgPCAxMCkgPyBcIjBcIiA6IFwiXCJ9JHtzZWNvbmRzfWA7XG59XG5cbi8qKlxuICogRm9ybWF0IHRoZSBwcm92aWRlZCBJTlNUQU5DRSBhcyBhIHBlcmNlbnRhZ2UgdXNpbmcgdGhlIFBST1ZJREVERk9STUFULFxuICogYW5kIHRoZSBTVEFURS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gaW5zdGFuY2UgLSBudW1icm8gaW5zdGFuY2UgdG8gZm9ybWF0XG4gKiBAcGFyYW0ge3t9fSBwcm92aWRlZEZvcm1hdCAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcGFyYW0gbnVtYnJvIC0gdGhlIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0UGVyY2VudGFnZShpbnN0YW5jZSwgcHJvdmlkZWRGb3JtYXQsIHN0YXRlLCBudW1icm8pIHtcbiAgICBsZXQgcHJlZml4U3ltYm9sID0gcHJvdmlkZWRGb3JtYXQucHJlZml4U3ltYm9sO1xuXG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJlcih7XG4gICAgICAgIGluc3RhbmNlOiBudW1icm8oaW5zdGFuY2UuX3ZhbHVlICogMTAwKSxcbiAgICAgICAgcHJvdmlkZWRGb3JtYXQsXG4gICAgICAgIHN0YXRlXG4gICAgfSk7XG4gICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgcHJvdmlkZWRGb3JtYXQpO1xuXG4gICAgaWYgKHByZWZpeFN5bWJvbCkge1xuICAgICAgICBpZiAoaW5zdGFuY2UuX3ZhbHVlIDwgMCAmJiBvcHRpb25zLm5lZ2F0aXZlID09PSBcInBhcmVudGhlc2lzXCIpe1xuICAgICAgICAgICAgcmV0dXJuIGAoJSR7b3B0aW9ucy5zcGFjZVNlcGFyYXRlZCA/IFwiIFwiIDogXCJcIn0ke291dHB1dC5zbGljZSgxKX1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGAlJHtvcHRpb25zLnNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwifSR7b3V0cHV0fWA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5zdGFuY2UuX3ZhbHVlIDwgMCAmJiBvcHRpb25zLm5lZ2F0aXZlID09PSBcInBhcmVudGhlc2lzXCIpe1xuICAgICAgICByZXR1cm4gYCR7b3V0cHV0LnNsaWNlKDAsIC0xKX0ke29wdGlvbnMuc3BhY2VTZXBhcmF0ZWQgPyBcIiBcIiA6IFwiXCJ9JSlgO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBgJHtvdXRwdXR9JHtvcHRpb25zLnNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwifSVgO1xuICAgIH1cbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGEgcGVyY2VudGFnZSB1c2luZyB0aGUgUFJPVklERURGT1JNQVQsXG4gKiBhbmQgdGhlIFNUQVRFLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBpbnN0YW5jZSAtIG51bWJybyBpbnN0YW5jZSB0byBmb3JtYXRcbiAqIEBwYXJhbSB7e319IHByb3ZpZGVkRm9ybWF0IC0gc3BlY2lmaWNhdGlvbiBmb3IgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtnbG9iYWxTdGF0ZX0gc3RhdGUgLSBzaGFyZWQgc3RhdGUgb2YgdGhlIGxpYnJhcnlcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0Q3VycmVuY3koaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSkge1xuICAgIGNvbnN0IGN1cnJlbnRDdXJyZW5jeSA9IHN0YXRlLmN1cnJlbnRDdXJyZW5jeSgpO1xuICAgIGxldCBjbG9uZWRGb3JtYXQgPSBPYmplY3QuYXNzaWduKHt9LCBwcm92aWRlZEZvcm1hdCk7XG4gICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgY2xvbmVkRm9ybWF0KTtcbiAgICBsZXQgZGVjaW1hbFNlcGFyYXRvciA9IHVuZGVmaW5lZDtcbiAgICBsZXQgc3BhY2UgPSBcIlwiO1xuICAgIGxldCBhdmVyYWdlID0gISFvcHRpb25zLnRvdGFsTGVuZ3RoIHx8ICEhb3B0aW9ucy5mb3JjZUF2ZXJhZ2UgfHwgb3B0aW9ucy5hdmVyYWdlO1xuICAgIGxldCBwb3NpdGlvbiA9IGNsb25lZEZvcm1hdC5jdXJyZW5jeVBvc2l0aW9uIHx8IGN1cnJlbnRDdXJyZW5jeS5wb3NpdGlvbjtcbiAgICBsZXQgc3ltYm9sID0gY2xvbmVkRm9ybWF0LmN1cnJlbmN5U3ltYm9sIHx8IGN1cnJlbnRDdXJyZW5jeS5zeW1ib2w7XG4gICAgY29uc3Qgc3BhY2VTZXBhcmF0ZWRDdXJyZW5jeSA9IG9wdGlvbnMuc3BhY2VTZXBhcmF0ZWRDdXJyZW5jeSAhPT0gdm9pZCAwXG4gICAgICAgID8gb3B0aW9ucy5zcGFjZVNlcGFyYXRlZEN1cnJlbmN5IDogb3B0aW9ucy5zcGFjZVNlcGFyYXRlZDtcblxuICAgIGlmIChjbG9uZWRGb3JtYXQubG93UHJlY2lzaW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY2xvbmVkRm9ybWF0Lmxvd1ByZWNpc2lvbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChzcGFjZVNlcGFyYXRlZEN1cnJlbmN5KSB7XG4gICAgICAgIHNwYWNlID0gXCIgXCI7XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uID09PSBcImluZml4XCIpIHtcbiAgICAgICAgZGVjaW1hbFNlcGFyYXRvciA9IHNwYWNlICsgc3ltYm9sICsgc3BhY2U7XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IGZvcm1hdE51bWJlcih7XG4gICAgICAgIGluc3RhbmNlLFxuICAgICAgICBwcm92aWRlZEZvcm1hdDogY2xvbmVkRm9ybWF0LFxuICAgICAgICBzdGF0ZSxcbiAgICAgICAgZGVjaW1hbFNlcGFyYXRvclxuICAgIH0pO1xuXG4gICAgaWYgKHBvc2l0aW9uID09PSBcInByZWZpeFwiKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZS5fdmFsdWUgPCAwICYmIG9wdGlvbnMubmVnYXRpdmUgPT09IFwic2lnblwiKSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBgLSR7c3BhY2V9JHtzeW1ib2x9JHtvdXRwdXQuc2xpY2UoMSl9YDtcbiAgICAgICAgfSBlbHNlIGlmIChpbnN0YW5jZS5fdmFsdWUgPCAwICYmIG9wdGlvbnMubmVnYXRpdmUgPT09IFwicGFyZW50aGVzaXNcIikge1xuICAgICAgICAgICAgb3V0cHV0ID0gYCgke3N5bWJvbH0ke3NwYWNlfSR7b3V0cHV0LnNsaWNlKDEpfWA7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5zdGFuY2UuX3ZhbHVlID4gMCAmJiBvcHRpb25zLmZvcmNlU2lnbikge1xuICAgICAgICAgICAgb3V0cHV0ID0gYCske3NwYWNlfSR7c3ltYm9sfSR7b3V0cHV0LnNsaWNlKDEpfWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXQgPSBzeW1ib2wgKyBzcGFjZSArIG91dHB1dDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghcG9zaXRpb24gfHwgcG9zaXRpb24gPT09IFwicG9zdGZpeFwiKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZS5fdmFsdWUgPCAwICYmIG9wdGlvbnMubmVnYXRpdmUgPT09IFwicGFyZW50aGVzaXNcIikge1xuICAgICAgICAgICAgb3V0cHV0ID0gYCR7b3V0cHV0LnNsaWNlKDAsIC0xKX0ke3NwYWNlfSR7c3ltYm9sfSlgXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzcGFjZSA9ICFvcHRpb25zLnNwYWNlU2VwYXJhdGVkQWJicmV2aWF0aW9uICYmIGF2ZXJhZ2UgPyBcIlwiIDogc3BhY2U7XG4gICAgICAgICAgICBvdXRwdXQgPSBvdXRwdXQgKyBzcGFjZSArIHN5bWJvbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvdXRwdXQ7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgYXZlcmFnZSB2YWx1ZSBvdXQgb2YgVkFMVUUuXG4gKiBUaGUgb3RoZXIgcGFyYW1ldGVycyBhcmUgY29tcHV0YXRpb24gb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSB2YWx1ZSB0byBjb21wdXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gW2ZvcmNlQXZlcmFnZV0gLSBmb3JjZWQgdW5pdCB1c2VkIHRvIGNvbXB1dGVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2xvd1ByZWNpc2lvbj10cnVlXSAtIHJlZHVjZSBhdmVyYWdlIHByZWNpc2lvblxuICogQHBhcmFtIHt7fX0gYWJicmV2aWF0aW9ucyAtIHBhcnQgb2YgdGhlIGxhbmd1YWdlIHNwZWNpZmljYXRpb25cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc3BhY2VTZXBhcmF0ZWQgLSBgdHJ1ZWAgaWYgYSBzcGFjZSBtdXN0IGJlIGluc2VydGVkIGJldHdlZW4gdGhlIHZhbHVlIGFuZCB0aGUgYWJicmV2aWF0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gW3RvdGFsTGVuZ3RoXSAtIHRvdGFsIGxlbmd0aCBvZiB0aGUgb3V0cHV0IGluY2x1ZGluZyB0aGUgY2hhcmFjdGVyaXN0aWMgYW5kIHRoZSBtYW50aXNzYVxuICogQHBhcmFtIHtmdW5jdGlvbn0gcm91bmRpbmdGdW5jdGlvbiAtIGZ1bmN0aW9uIHVzZWQgdG8gcm91bmQgbnVtYmVyc1xuICogQHJldHVybiB7e3ZhbHVlOiBudW1iZXIsIGFiYnJldmlhdGlvbjogc3RyaW5nLCBtYW50aXNzYVByZWNpc2lvbjogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUF2ZXJhZ2UoeyB2YWx1ZSwgZm9yY2VBdmVyYWdlLCBsb3dQcmVjaXNpb24gPSB0cnVlLCBhYmJyZXZpYXRpb25zLCBzcGFjZVNlcGFyYXRlZCA9IGZhbHNlLCB0b3RhbExlbmd0aCA9IDAsIHJvdW5kaW5nRnVuY3Rpb24gPSBNYXRoLnJvdW5kIH0pIHtcbiAgICBsZXQgYWJicmV2aWF0aW9uID0gXCJcIjtcbiAgICBsZXQgYWJzID0gTWF0aC5hYnModmFsdWUpO1xuICAgIGxldCBtYW50aXNzYVByZWNpc2lvbiA9IC0xO1xuXG4gICAgaWYgKGZvcmNlQXZlcmFnZSAmJiBhYmJyZXZpYXRpb25zW2ZvcmNlQXZlcmFnZV0gJiYgcG93ZXJzW2ZvcmNlQXZlcmFnZV0pIHtcbiAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9uc1tmb3JjZUF2ZXJhZ2VdO1xuICAgICAgICB2YWx1ZSA9IHZhbHVlIC8gcG93ZXJzW2ZvcmNlQXZlcmFnZV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGFicyA+PSBwb3dlcnMudHJpbGxpb24gfHwgKGxvd1ByZWNpc2lvbiAmJiByb3VuZGluZ0Z1bmN0aW9uKGFicyAvIHBvd2Vycy50cmlsbGlvbikgPT09IDEpKSB7XG4gICAgICAgICAgICAvLyB0cmlsbGlvblxuICAgICAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy50cmlsbGlvbjtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBwb3dlcnMudHJpbGxpb247XG4gICAgICAgIH0gZWxzZSBpZiAoYWJzIDwgcG93ZXJzLnRyaWxsaW9uICYmIGFicyA+PSBwb3dlcnMuYmlsbGlvbiB8fCAobG93UHJlY2lzaW9uICYmIHJvdW5kaW5nRnVuY3Rpb24oYWJzIC8gcG93ZXJzLmJpbGxpb24pID09PSAxKSkge1xuICAgICAgICAgICAgLy8gYmlsbGlvblxuICAgICAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy5iaWxsaW9uO1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIHBvd2Vycy5iaWxsaW9uO1xuICAgICAgICB9IGVsc2UgaWYgKGFicyA8IHBvd2Vycy5iaWxsaW9uICYmIGFicyA+PSBwb3dlcnMubWlsbGlvbiB8fCAobG93UHJlY2lzaW9uICYmIHJvdW5kaW5nRnVuY3Rpb24oYWJzIC8gcG93ZXJzLm1pbGxpb24pID09PSAxKSkge1xuICAgICAgICAgICAgLy8gbWlsbGlvblxuICAgICAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy5taWxsaW9uO1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSAvIHBvd2Vycy5taWxsaW9uO1xuICAgICAgICB9IGVsc2UgaWYgKGFicyA8IHBvd2Vycy5taWxsaW9uICYmIGFicyA+PSBwb3dlcnMudGhvdXNhbmQgfHwgKGxvd1ByZWNpc2lvbiAmJiByb3VuZGluZ0Z1bmN0aW9uKGFicyAvIHBvd2Vycy50aG91c2FuZCkgPT09IDEpKSB7XG4gICAgICAgICAgICAvLyB0aG91c2FuZFxuICAgICAgICAgICAgYWJicmV2aWF0aW9uID0gYWJicmV2aWF0aW9ucy50aG91c2FuZDtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgLyBwb3dlcnMudGhvdXNhbmQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgb3B0aW9uYWxTcGFjZSA9IHNwYWNlU2VwYXJhdGVkID8gXCIgXCIgOiBcIlwiO1xuXG4gICAgaWYgKGFiYnJldmlhdGlvbikge1xuICAgICAgICBhYmJyZXZpYXRpb24gPSBvcHRpb25hbFNwYWNlICsgYWJicmV2aWF0aW9uO1xuICAgIH1cblxuICAgIGlmICh0b3RhbExlbmd0aCkge1xuICAgICAgICBsZXQgaXNOZWdhdGl2ZSA9IHZhbHVlIDwgMDtcbiAgICAgICAgbGV0IGNoYXJhY3RlcmlzdGljID0gdmFsdWUudG9TdHJpbmcoKS5zcGxpdChcIi5cIilbMF07XG5cbiAgICAgICAgbGV0IGNoYXJhY3RlcmlzdGljTGVuZ3RoID0gaXNOZWdhdGl2ZVxuICAgICAgICAgICAgPyBjaGFyYWN0ZXJpc3RpYy5sZW5ndGggLSAxXG4gICAgICAgICAgICA6IGNoYXJhY3RlcmlzdGljLmxlbmd0aDtcblxuICAgICAgICBtYW50aXNzYVByZWNpc2lvbiA9IE1hdGgubWF4KHRvdGFsTGVuZ3RoIC0gY2hhcmFjdGVyaXN0aWNMZW5ndGgsIDApO1xuICAgIH1cblxuICAgIHJldHVybiB7IHZhbHVlLCBhYmJyZXZpYXRpb24sIG1hbnRpc3NhUHJlY2lzaW9uIH07XG59XG5cbi8qKlxuICogQ29tcHV0ZSBhbiBleHBvbmVudGlhbCBmb3JtIGZvciBWQUxVRSwgdGFraW5nIGludG8gYWNjb3VudCBDSEFSQUNURVJJU1RJQ1xuICogaWYgcHJvdmlkZWQuXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSB2YWx1ZSB0byBjb21wdXRlXG4gKiBAcGFyYW0ge251bWJlcn0gW2NoYXJhY3RlcmlzdGljUHJlY2lzaW9uXSAtIG9wdGlvbmFsIGNoYXJhY3RlcmlzdGljIGxlbmd0aFxuICogQHJldHVybiB7e3ZhbHVlOiBudW1iZXIsIGFiYnJldmlhdGlvbjogc3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUV4cG9uZW50aWFsKHsgdmFsdWUsIGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uID0gMCB9KSB7XG4gICAgbGV0IFtudW1iZXJTdHJpbmcsIGV4cG9uZW50aWFsXSA9IHZhbHVlLnRvRXhwb25lbnRpYWwoKS5zcGxpdChcImVcIik7XG4gICAgbGV0IG51bWJlciA9ICtudW1iZXJTdHJpbmc7XG5cbiAgICBpZiAoIWNoYXJhY3RlcmlzdGljUHJlY2lzaW9uKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB2YWx1ZTogbnVtYmVyLFxuICAgICAgICAgICAgYWJicmV2aWF0aW9uOiBgZSR7ZXhwb25lbnRpYWx9YFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGxldCBjaGFyYWN0ZXJpc3RpY0xlbmd0aCA9IDE7IC8vIHNlZSBgdG9FeHBvbmVudGlhbGBcblxuICAgIGlmIChjaGFyYWN0ZXJpc3RpY0xlbmd0aCA8IGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uKSB7XG4gICAgICAgIG51bWJlciA9IG51bWJlciAqIE1hdGgucG93KDEwLCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbiAtIGNoYXJhY3RlcmlzdGljTGVuZ3RoKTtcbiAgICAgICAgZXhwb25lbnRpYWwgPSArZXhwb25lbnRpYWwgLSAoY2hhcmFjdGVyaXN0aWNQcmVjaXNpb24gLSBjaGFyYWN0ZXJpc3RpY0xlbmd0aCk7XG4gICAgICAgIGV4cG9uZW50aWFsID0gZXhwb25lbnRpYWwgPj0gMCA/IGArJHtleHBvbmVudGlhbH1gIDogZXhwb25lbnRpYWw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IG51bWJlcixcbiAgICAgICAgYWJicmV2aWF0aW9uOiBgZSR7ZXhwb25lbnRpYWx9YFxuICAgIH07XG59XG5cbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIG9mIE5VTUJFUiB6ZXJvLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBudW1iZXIgLSBMZW5ndGggb2YgdGhlIG91dHB1dFxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiB6ZXJvZXMobnVtYmVyKSB7XG4gICAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1iZXI7IGkrKykge1xuICAgICAgICByZXN1bHQgKz0gXCIwXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIFZBTFVFIHdpdGggYSBQUkVDSVNJT04tbG9uZyBtYW50aXNzYS5cbiAqIFRoaXMgbWV0aG9kIGlzIGZvciBsYXJnZS9zbWFsbCBudW1iZXJzIG9ubHkgKGEuay5hLiBpbmNsdWRpbmcgYSBcImVcIikuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIHRvIHByZWNpc2VcbiAqIEBwYXJhbSB7bnVtYmVyfSBwcmVjaXNpb24gLSBkZXNpcmVkIGxlbmd0aCBmb3IgdGhlIG1hbnRpc3NhXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHRvRml4ZWRMYXJnZSh2YWx1ZSwgcHJlY2lzaW9uKSB7XG4gICAgbGV0IHJlc3VsdCA9IHZhbHVlLnRvU3RyaW5nKCk7XG5cbiAgICBsZXQgW2Jhc2UsIGV4cF0gPSByZXN1bHQuc3BsaXQoXCJlXCIpO1xuXG4gICAgbGV0IFtjaGFyYWN0ZXJpc3RpYywgbWFudGlzc2EgPSBcIlwiXSA9IGJhc2Uuc3BsaXQoXCIuXCIpO1xuXG4gICAgaWYgKCtleHAgPiAwKSB7XG4gICAgICAgIHJlc3VsdCA9IGNoYXJhY3RlcmlzdGljICsgbWFudGlzc2EgKyB6ZXJvZXMoZXhwIC0gbWFudGlzc2EubGVuZ3RoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJlZml4ID0gXCIuXCI7XG5cbiAgICAgICAgaWYgKCtjaGFyYWN0ZXJpc3RpYyA8IDApIHtcbiAgICAgICAgICAgIHByZWZpeCA9IGAtMCR7cHJlZml4fWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcmVmaXggPSBgMCR7cHJlZml4fWA7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3VmZml4ID0gKHplcm9lcygtZXhwIC0gMSkgKyBNYXRoLmFicyhjaGFyYWN0ZXJpc3RpYykgKyBtYW50aXNzYSkuc3Vic3RyKDAsIHByZWNpc2lvbik7XG4gICAgICAgIGlmIChzdWZmaXgubGVuZ3RoIDwgcHJlY2lzaW9uKSB7XG4gICAgICAgICAgICBzdWZmaXggKz0gemVyb2VzKHByZWNpc2lvbiAtIHN1ZmZpeC5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IHByZWZpeCArIHN1ZmZpeDtcbiAgICB9XG5cbiAgICBpZiAoK2V4cCA+IDAgJiYgcHJlY2lzaW9uID4gMCkge1xuICAgICAgICByZXN1bHQgKz0gYC4ke3plcm9lcyhwcmVjaXNpb24pfWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYSBzdHJpbmcgcmVwcmVzZW50aW5nIFZBTFVFIHdpdGggYSBQUkVDSVNJT04tbG9uZyBtYW50aXNzYS5cbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgdG8gcHJlY2lzZVxuICogQHBhcmFtIHtudW1iZXJ9IHByZWNpc2lvbiAtIGRlc2lyZWQgbGVuZ3RoIGZvciB0aGUgbWFudGlzc2FcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHJvdW5kaW5nRnVuY3Rpb24gLSByb3VuZGluZyBmdW5jdGlvbiB0byBiZSB1c2VkXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHRvRml4ZWQodmFsdWUsIHByZWNpc2lvbiwgcm91bmRpbmdGdW5jdGlvbiA9IE1hdGgucm91bmQpIHtcbiAgICBpZiAodmFsdWUudG9TdHJpbmcoKS5pbmRleE9mKFwiZVwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRvRml4ZWRMYXJnZSh2YWx1ZSwgcHJlY2lzaW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKHJvdW5kaW5nRnVuY3Rpb24oK2Ake3ZhbHVlfWUrJHtwcmVjaXNpb259YCkgLyAoTWF0aC5wb3coMTAsIHByZWNpc2lvbikpKS50b0ZpeGVkKHByZWNpc2lvbik7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IE9VVFBVVCB3aXRoIGEgbWFudGlzc2EgcHJlY2lzaW9uIG9mIFBSRUNJU0lPTi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciBiZWluZyBjdXJyZW50bHkgZm9ybWF0dGVkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbmFsTWFudGlzc2EgLSBpZiBgdHJ1ZWAsIHRoZSBtYW50aXNzYSBpcyBvbWl0dGVkIHdoZW4gaXQncyBvbmx5IHplcm9lc1xuICogQHBhcmFtIHtudW1iZXJ9IHByZWNpc2lvbiAtIGRlc2lyZWQgcHJlY2lzaW9uIG9mIHRoZSBtYW50aXNzYVxuICogQHBhcmFtIHtib29sZWFufSB0cmltIC0gaWYgYHRydWVgLCB0cmFpbGluZyB6ZXJvZXMgYXJlIHJlbW92ZWQgZnJvbSB0aGUgbWFudGlzc2FcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gc2V0TWFudGlzc2FQcmVjaXNpb24ob3V0cHV0LCB2YWx1ZSwgb3B0aW9uYWxNYW50aXNzYSwgcHJlY2lzaW9uLCB0cmltLCByb3VuZGluZ0Z1bmN0aW9uKSB7XG4gICAgaWYgKHByZWNpc2lvbiA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICBsZXQgcmVzdWx0ID0gdG9GaXhlZCh2YWx1ZSwgcHJlY2lzaW9uLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICBsZXQgW2N1cnJlbnRDaGFyYWN0ZXJpc3RpYywgY3VycmVudE1hbnRpc3NhID0gXCJcIl0gPSByZXN1bHQudG9TdHJpbmcoKS5zcGxpdChcIi5cIik7XG5cbiAgICBpZiAoY3VycmVudE1hbnRpc3NhLm1hdGNoKC9eMCskLykgJiYgKG9wdGlvbmFsTWFudGlzc2EgfHwgdHJpbSkpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRDaGFyYWN0ZXJpc3RpYztcbiAgICB9XG5cbiAgICBsZXQgaGFzVHJhaWxpbmdaZXJvZXMgPSBjdXJyZW50TWFudGlzc2EubWF0Y2goLzArJC8pO1xuICAgIGlmICh0cmltICYmIGhhc1RyYWlsaW5nWmVyb2VzKSB7XG4gICAgICAgIHJldHVybiBgJHtjdXJyZW50Q2hhcmFjdGVyaXN0aWN9LiR7Y3VycmVudE1hbnRpc3NhLnRvU3RyaW5nKCkuc2xpY2UoMCwgaGFzVHJhaWxpbmdaZXJvZXMuaW5kZXgpfWA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdC50b1N0cmluZygpO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBPVVRQVVQgd2l0aCBhIGNoYXJhY3RlcmlzdGljIHByZWNpc2lvbiBvZiBQUkVDSVNJT04uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgYmVpbmcgY3VycmVudGx5IGZvcm1hdHRlZFxuICogQHBhcmFtIHtib29sZWFufSBvcHRpb25hbENoYXJhY3RlcmlzdGljIC0gYHRydWVgIGlmIHRoZSBjaGFyYWN0ZXJpc3RpYyBpcyBvbWl0dGVkIHdoZW4gaXQncyBvbmx5IHplcm9lc1xuICogQHBhcmFtIHtudW1iZXJ9IHByZWNpc2lvbiAtIGRlc2lyZWQgcHJlY2lzaW9uIG9mIHRoZSBjaGFyYWN0ZXJpc3RpY1xuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBzZXRDaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbihvdXRwdXQsIHZhbHVlLCBvcHRpb25hbENoYXJhY3RlcmlzdGljLCBwcmVjaXNpb24pIHtcbiAgICBsZXQgcmVzdWx0ID0gb3V0cHV0O1xuICAgIGxldCBbY3VycmVudENoYXJhY3RlcmlzdGljLCBjdXJyZW50TWFudGlzc2FdID0gcmVzdWx0LnRvU3RyaW5nKCkuc3BsaXQoXCIuXCIpO1xuXG4gICAgaWYgKGN1cnJlbnRDaGFyYWN0ZXJpc3RpYy5tYXRjaCgvXi0/MCQvKSAmJiBvcHRpb25hbENoYXJhY3RlcmlzdGljKSB7XG4gICAgICAgIGlmICghY3VycmVudE1hbnRpc3NhKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudENoYXJhY3RlcmlzdGljLnJlcGxhY2UoXCIwXCIsIFwiXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGAke2N1cnJlbnRDaGFyYWN0ZXJpc3RpYy5yZXBsYWNlKFwiMFwiLCBcIlwiKX0uJHtjdXJyZW50TWFudGlzc2F9YDtcbiAgICB9XG5cbiAgICBjb25zdCBoYXNOZWdhdGl2ZVNpZ24gPSB2YWx1ZSA8IDAgJiYgY3VycmVudENoYXJhY3RlcmlzdGljLmluZGV4T2YoXCItXCIpID09PSAwO1xuICAgIGlmIChoYXNOZWdhdGl2ZVNpZ24pIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgbmVnYXRpdmUgc2lnblxuICAgICAgICAgICAgY3VycmVudENoYXJhY3RlcmlzdGljID0gY3VycmVudENoYXJhY3RlcmlzdGljLnNsaWNlKDEpO1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnNsaWNlKDEpO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50Q2hhcmFjdGVyaXN0aWMubGVuZ3RoIDwgcHJlY2lzaW9uKSB7XG4gICAgICAgIGxldCBtaXNzaW5nWmVyb3MgPSBwcmVjaXNpb24gLSBjdXJyZW50Q2hhcmFjdGVyaXN0aWMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1pc3NpbmdaZXJvczsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBgMCR7cmVzdWx0fWA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaGFzTmVnYXRpdmVTaWduKSB7XG4gICAgICAgIC8vIEFkZCBiYWNrIHRoZSBtaW51cyBzaWduXG4gICAgICAgIHJlc3VsdCA9IGAtJHtyZXN1bHR9YDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC50b1N0cmluZygpO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgaW5kZXhlcyB3aGVyZSBhcmUgdGhlIGdyb3VwIHNlcGFyYXRpb25zIGFmdGVyIHNwbGl0dGluZ1xuICogYHRvdGFsTGVuZ3RoYCBpbiBncm91cCBvZiBgZ3JvdXBTaXplYCBzaXplLlxuICogSW1wb3J0YW50OiB3ZSBzdGFydCBncm91cGluZyBmcm9tIHRoZSByaWdodCBoYW5kIHNpZGUuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHRvdGFsTGVuZ3RoIC0gdG90YWwgbGVuZ3RoIG9mIHRoZSBjaGFyYWN0ZXJpc3RpYyB0byBzcGxpdFxuICogQHBhcmFtIHtudW1iZXJ9IGdyb3VwU2l6ZSAtIGxlbmd0aCBvZiBlYWNoIGdyb3VwXG4gKiBAcmV0dXJuIHtbbnVtYmVyXX1cbiAqL1xuZnVuY3Rpb24gaW5kZXhlc09mR3JvdXBTcGFjZXModG90YWxMZW5ndGgsIGdyb3VwU2l6ZSkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBsZXQgY291bnRlciA9IDA7XG4gICAgZm9yIChsZXQgaSA9IHRvdGFsTGVuZ3RoOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIGlmIChjb3VudGVyID09PSBncm91cFNpemUpIHtcbiAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0KGkpO1xuICAgICAgICAgICAgY291bnRlciA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgY291bnRlcisrO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmVwbGFjZSB0aGUgZGVjaW1hbCBzZXBhcmF0b3Igd2l0aCBERUNJTUFMU0VQQVJBVE9SIGFuZCBpbnNlcnQgdGhvdXNhbmRcbiAqIHNlcGFyYXRvcnMuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgLSBudW1iZXIgYmVpbmcgY3VycmVudGx5IGZvcm1hdHRlZFxuICogQHBhcmFtIHtib29sZWFufSB0aG91c2FuZFNlcGFyYXRlZCAtIGB0cnVlYCBpZiB0aGUgY2hhcmFjdGVyaXN0aWMgbXVzdCBiZSBzZXBhcmF0ZWRcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gZGVjaW1hbFNlcGFyYXRvciAtIHN0cmluZyB0byB1c2UgYXMgZGVjaW1hbCBzZXBhcmF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gcmVwbGFjZURlbGltaXRlcnMob3V0cHV0LCB2YWx1ZSwgdGhvdXNhbmRTZXBhcmF0ZWQsIHN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yKSB7XG4gICAgbGV0IGRlbGltaXRlcnMgPSBzdGF0ZS5jdXJyZW50RGVsaW1pdGVycygpO1xuICAgIGxldCB0aG91c2FuZFNlcGFyYXRvciA9IGRlbGltaXRlcnMudGhvdXNhbmRzO1xuICAgIGRlY2ltYWxTZXBhcmF0b3IgPSBkZWNpbWFsU2VwYXJhdG9yIHx8IGRlbGltaXRlcnMuZGVjaW1hbDtcbiAgICBsZXQgdGhvdXNhbmRzU2l6ZSA9IGRlbGltaXRlcnMudGhvdXNhbmRzU2l6ZSB8fCAzO1xuXG4gICAgbGV0IHJlc3VsdCA9IG91dHB1dC50b1N0cmluZygpO1xuICAgIGxldCBjaGFyYWN0ZXJpc3RpYyA9IHJlc3VsdC5zcGxpdChcIi5cIilbMF07XG4gICAgbGV0IG1hbnRpc3NhID0gcmVzdWx0LnNwbGl0KFwiLlwiKVsxXTtcbiAgICBjb25zdCBoYXNOZWdhdGl2ZVNpZ24gPSB2YWx1ZSA8IDAgJiYgY2hhcmFjdGVyaXN0aWMuaW5kZXhPZihcIi1cIikgPT09IDA7XG5cbiAgICBpZiAodGhvdXNhbmRTZXBhcmF0ZWQpIHtcbiAgICAgICAgaWYgKGhhc05lZ2F0aXZlU2lnbikge1xuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBuZWdhdGl2ZSBzaWduXG4gICAgICAgICAgICBjaGFyYWN0ZXJpc3RpYyA9IGNoYXJhY3RlcmlzdGljLnNsaWNlKDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGluZGV4ZXNUb0luc2VydFRob3VzYW5kRGVsaW1pdGVycyA9IGluZGV4ZXNPZkdyb3VwU3BhY2VzKGNoYXJhY3RlcmlzdGljLmxlbmd0aCwgdGhvdXNhbmRzU2l6ZSk7XG4gICAgICAgIGluZGV4ZXNUb0luc2VydFRob3VzYW5kRGVsaW1pdGVycy5mb3JFYWNoKChwb3NpdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljID0gY2hhcmFjdGVyaXN0aWMuc2xpY2UoMCwgcG9zaXRpb24gKyBpbmRleCkgKyB0aG91c2FuZFNlcGFyYXRvciArIGNoYXJhY3RlcmlzdGljLnNsaWNlKHBvc2l0aW9uICsgaW5kZXgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoaGFzTmVnYXRpdmVTaWduKSB7XG4gICAgICAgICAgICAvLyBBZGQgYmFjayB0aGUgbmVnYXRpdmUgc2lnblxuICAgICAgICAgICAgY2hhcmFjdGVyaXN0aWMgPSBgLSR7Y2hhcmFjdGVyaXN0aWN9YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghbWFudGlzc2EpIHtcbiAgICAgICAgcmVzdWx0ID0gY2hhcmFjdGVyaXN0aWM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gY2hhcmFjdGVyaXN0aWMgKyBkZWNpbWFsU2VwYXJhdG9yICsgbWFudGlzc2E7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogSW5zZXJ0IHRoZSBwcm92aWRlZCBBQkJSRVZJQVRJT04gYXQgdGhlIGVuZCBvZiBPVVRQVVQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dCAtIG91dHB1dCBiZWluZyBidWlsZCBpbiB0aGUgcHJvY2VzcyBvZiBmb3JtYXR0aW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gYWJicmV2aWF0aW9uIC0gYWJicmV2aWF0aW9uIHRvIGFwcGVuZFxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0QWJicmV2aWF0aW9uKG91dHB1dCwgYWJicmV2aWF0aW9uKSB7XG4gICAgcmV0dXJuIG91dHB1dCArIGFiYnJldmlhdGlvbjtcbn1cblxuLyoqXG4gKiBJbnNlcnQgdGhlIHBvc2l0aXZlL25lZ2F0aXZlIHNpZ24gYWNjb3JkaW5nIHRvIHRoZSBORUdBVElWRSBmbGFnLlxuICogSWYgdGhlIHZhbHVlIGlzIG5lZ2F0aXZlIGJ1dCBzdGlsbCBvdXRwdXQgYXMgMCwgdGhlIG5lZ2F0aXZlIHNpZ24gaXMgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIG51bWJlciBiZWluZyBjdXJyZW50bHkgZm9ybWF0dGVkXG4gKiBAcGFyYW0ge3N0cmluZ30gbmVnYXRpdmUgLSBmbGFnIGZvciB0aGUgbmVnYXRpdmUgZm9ybSAoXCJzaWduXCIgb3IgXCJwYXJlbnRoZXNpc1wiKVxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0U2lnbihvdXRwdXQsIHZhbHVlLCBuZWdhdGl2ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgIGlmICgrb3V0cHV0ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBvdXRwdXQucmVwbGFjZShcIi1cIiwgXCJcIik7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlID4gMCkge1xuICAgICAgICByZXR1cm4gYCske291dHB1dH1gO1xuICAgIH1cblxuICAgIGlmIChuZWdhdGl2ZSA9PT0gXCJzaWduXCIpIHtcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICByZXR1cm4gYCgke291dHB1dC5yZXBsYWNlKFwiLVwiLCBcIlwiKX0pYDtcbn1cblxuLyoqXG4gKiBJbnNlcnQgdGhlIHByb3ZpZGVkIFBSRUZJWCBhdCB0aGUgc3RhcnQgb2YgT1VUUFVULlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXQgLSBvdXRwdXQgYmVpbmcgYnVpbGQgaW4gdGhlIHByb2Nlc3Mgb2YgZm9ybWF0dGluZ1xuICogQHBhcmFtIHtzdHJpbmd9IHByZWZpeCAtIGFiYnJldmlhdGlvbiB0byBwcmVwZW5kXG4gKiBAcmV0dXJuIHsqfVxuICovXG5mdW5jdGlvbiBpbnNlcnRQcmVmaXgob3V0cHV0LCBwcmVmaXgpIHtcbiAgICByZXR1cm4gcHJlZml4ICsgb3V0cHV0O1xufVxuXG4vKipcbiAqIEluc2VydCB0aGUgcHJvdmlkZWQgUE9TVEZJWCBhdCB0aGUgZW5kIG9mIE9VVFBVVC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0IC0gb3V0cHV0IGJlaW5nIGJ1aWxkIGluIHRoZSBwcm9jZXNzIG9mIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBwb3N0Zml4IC0gYWJicmV2aWF0aW9uIHRvIGFwcGVuZFxuICogQHJldHVybiB7Kn1cbiAqL1xuZnVuY3Rpb24gaW5zZXJ0UG9zdGZpeChvdXRwdXQsIHBvc3RmaXgpIHtcbiAgICByZXR1cm4gb3V0cHV0ICsgcG9zdGZpeDtcbn1cblxuLyoqXG4gKiBGb3JtYXQgdGhlIHByb3ZpZGVkIElOU1RBTkNFIGFzIGEgbnVtYmVyIHVzaW5nIHRoZSBQUk9WSURFREZPUk1BVCxcbiAqIGFuZCB0aGUgU1RBVEUuXG4gKiBUaGlzIGlzIHRoZSBrZXkgbWV0aG9kIG9mIHRoZSBmcmFtZXdvcmshXG4gKlxuICogQHBhcmFtIHtOdW1icm99IGluc3RhbmNlIC0gbnVtYnJvIGluc3RhbmNlIHRvIGZvcm1hdFxuICogQHBhcmFtIHt7fX0gW3Byb3ZpZGVkRm9ybWF0XSAtIHNwZWNpZmljYXRpb24gZm9yIGZvcm1hdHRpbmdcbiAqIEBwYXJhbSB7Z2xvYmFsU3RhdGV9IHN0YXRlIC0gc2hhcmVkIHN0YXRlIG9mIHRoZSBsaWJyYXJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gZGVjaW1hbFNlcGFyYXRvciAtIHN0cmluZyB0byB1c2UgYXMgZGVjaW1hbCBzZXBhcmF0b3JcbiAqIEBwYXJhbSB7e319IGRlZmF1bHRzIC0gU2V0IG9mIGRlZmF1bHQgdmFsdWVzIHVzZWQgZm9yIGZvcm1hdHRpbmdcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZm9ybWF0TnVtYmVyKHsgaW5zdGFuY2UsIHByb3ZpZGVkRm9ybWF0LCBzdGF0ZSA9IGdsb2JhbFN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yLCBkZWZhdWx0cyA9IHN0YXRlLmN1cnJlbnREZWZhdWx0cygpIH0pIHtcbiAgICBsZXQgdmFsdWUgPSBpbnN0YW5jZS5fdmFsdWU7XG5cbiAgICBpZiAodmFsdWUgPT09IDAgJiYgc3RhdGUuaGFzWmVyb0Zvcm1hdCgpKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5nZXRaZXJvRm9ybWF0KCk7XG4gICAgfVxuXG4gICAgaWYgKCFpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgbGV0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgZGVmYXVsdHMsIHByb3ZpZGVkRm9ybWF0KTtcblxuICAgIGxldCB0b3RhbExlbmd0aCA9IG9wdGlvbnMudG90YWxMZW5ndGg7XG4gICAgbGV0IGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uID0gdG90YWxMZW5ndGggPyAwIDogb3B0aW9ucy5jaGFyYWN0ZXJpc3RpYztcbiAgICBsZXQgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyA9IG9wdGlvbnMub3B0aW9uYWxDaGFyYWN0ZXJpc3RpYztcbiAgICBsZXQgZm9yY2VBdmVyYWdlID0gb3B0aW9ucy5mb3JjZUF2ZXJhZ2U7XG4gICAgbGV0IGxvd1ByZWNpc2lvbiA9IG9wdGlvbnMubG93UHJlY2lzaW9uO1xuICAgIGxldCBhdmVyYWdlID0gISF0b3RhbExlbmd0aCB8fCAhIWZvcmNlQXZlcmFnZSB8fCBvcHRpb25zLmF2ZXJhZ2U7XG5cbiAgICAvLyBkZWZhdWx0IHdoZW4gYXZlcmFnaW5nIGlzIHRvIGNob3Agb2ZmIGRlY2ltYWxzXG4gICAgbGV0IG1hbnRpc3NhUHJlY2lzaW9uID0gdG90YWxMZW5ndGggPyAtMSA6IChhdmVyYWdlICYmIHByb3ZpZGVkRm9ybWF0Lm1hbnRpc3NhID09PSB1bmRlZmluZWQgPyAwIDogb3B0aW9ucy5tYW50aXNzYSk7XG4gICAgbGV0IG9wdGlvbmFsTWFudGlzc2EgPSB0b3RhbExlbmd0aCA/IGZhbHNlIDogKHByb3ZpZGVkRm9ybWF0Lm9wdGlvbmFsTWFudGlzc2EgPT09IHVuZGVmaW5lZCA/IG1hbnRpc3NhUHJlY2lzaW9uID09PSAtMSA6IG9wdGlvbnMub3B0aW9uYWxNYW50aXNzYSk7XG4gICAgbGV0IHRyaW1NYW50aXNzYSA9IG9wdGlvbnMudHJpbU1hbnRpc3NhO1xuICAgIGxldCB0aG91c2FuZFNlcGFyYXRlZCA9IG9wdGlvbnMudGhvdXNhbmRTZXBhcmF0ZWQ7XG4gICAgbGV0IHNwYWNlU2VwYXJhdGVkID0gb3B0aW9ucy5zcGFjZVNlcGFyYXRlZDtcbiAgICBsZXQgbmVnYXRpdmUgPSBvcHRpb25zLm5lZ2F0aXZlO1xuICAgIGxldCBmb3JjZVNpZ24gPSBvcHRpb25zLmZvcmNlU2lnbjtcbiAgICBsZXQgZXhwb25lbnRpYWwgPSBvcHRpb25zLmV4cG9uZW50aWFsO1xuICAgIGxldCByb3VuZGluZ0Z1bmN0aW9uID0gb3B0aW9ucy5yb3VuZGluZ0Z1bmN0aW9uO1xuXG4gICAgbGV0IGFiYnJldmlhdGlvbiA9IFwiXCI7XG4gICAgaWYgKGF2ZXJhZ2UpIHtcbiAgICAgICAgbGV0IGRhdGEgPSBjb21wdXRlQXZlcmFnZSh7XG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGZvcmNlQXZlcmFnZSxcbiAgICAgICAgICAgIGxvd1ByZWNpc2lvbixcbiAgICAgICAgICAgIGFiYnJldmlhdGlvbnM6IHN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zKCksXG4gICAgICAgICAgICBzcGFjZVNlcGFyYXRlZCxcbiAgICAgICAgICAgIHJvdW5kaW5nRnVuY3Rpb24sXG4gICAgICAgICAgICB0b3RhbExlbmd0aFxuICAgICAgICB9KTtcblxuICAgICAgICB2YWx1ZSA9IGRhdGEudmFsdWU7XG4gICAgICAgIGFiYnJldmlhdGlvbiArPSBkYXRhLmFiYnJldmlhdGlvbjtcblxuICAgICAgICBpZiAodG90YWxMZW5ndGgpIHtcbiAgICAgICAgICAgIG1hbnRpc3NhUHJlY2lzaW9uID0gZGF0YS5tYW50aXNzYVByZWNpc2lvbjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHBvbmVudGlhbCkge1xuICAgICAgICBsZXQgZGF0YSA9IGNvbXB1dGVFeHBvbmVudGlhbCh7XG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGNoYXJhY3RlcmlzdGljUHJlY2lzaW9uXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhbHVlID0gZGF0YS52YWx1ZTtcbiAgICAgICAgYWJicmV2aWF0aW9uID0gZGF0YS5hYmJyZXZpYXRpb24gKyBhYmJyZXZpYXRpb247XG4gICAgfVxuXG4gICAgbGV0IG91dHB1dCA9IHNldE1hbnRpc3NhUHJlY2lzaW9uKHZhbHVlLnRvU3RyaW5nKCksIHZhbHVlLCBvcHRpb25hbE1hbnRpc3NhLCBtYW50aXNzYVByZWNpc2lvbiwgdHJpbU1hbnRpc3NhLCByb3VuZGluZ0Z1bmN0aW9uKTtcbiAgICBvdXRwdXQgPSBzZXRDaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbihvdXRwdXQsIHZhbHVlLCBvcHRpb25hbENoYXJhY3RlcmlzdGljLCBjaGFyYWN0ZXJpc3RpY1ByZWNpc2lvbik7XG4gICAgb3V0cHV0ID0gcmVwbGFjZURlbGltaXRlcnMob3V0cHV0LCB2YWx1ZSwgdGhvdXNhbmRTZXBhcmF0ZWQsIHN0YXRlLCBkZWNpbWFsU2VwYXJhdG9yKTtcblxuICAgIGlmIChhdmVyYWdlIHx8IGV4cG9uZW50aWFsKSB7XG4gICAgICAgIG91dHB1dCA9IGluc2VydEFiYnJldmlhdGlvbihvdXRwdXQsIGFiYnJldmlhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKGZvcmNlU2lnbiB8fCB2YWx1ZSA8IDApIHtcbiAgICAgICAgb3V0cHV0ID0gaW5zZXJ0U2lnbihvdXRwdXQsIHZhbHVlLCBuZWdhdGl2ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBJZiBGT1JNQVQgaXMgbm9uLW51bGwgYW5kIG5vdCBqdXN0IGFuIG91dHB1dCwgcmV0dXJuIEZPUk1BVC5cbiAqIFJldHVybiBERUZBVUxURk9STUFUIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0gcHJvdmlkZWRGb3JtYXRcbiAqIEBwYXJhbSBkZWZhdWx0Rm9ybWF0XG4gKi9cbmZ1bmN0aW9uIGZvcm1hdE9yRGVmYXVsdChwcm92aWRlZEZvcm1hdCwgZGVmYXVsdEZvcm1hdCkge1xuICAgIGlmICghcHJvdmlkZWRGb3JtYXQpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuXG4gICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwcm92aWRlZEZvcm1hdCk7XG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAxICYmIGtleXNbMF0gPT09IFwib3V0cHV0XCIpIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRGb3JtYXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3ZpZGVkRm9ybWF0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChudW1icm8pID0+ICh7XG4gICAgZm9ybWF0OiAoLi4uYXJncykgPT4gZm9ybWF0KC4uLmFyZ3MsIG51bWJybyksXG4gICAgZ2V0Qnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXRCeXRlVW5pdCguLi5hcmdzLCBudW1icm8pLFxuICAgIGdldEJpbmFyeUJ5dGVVbml0OiAoLi4uYXJncykgPT4gZ2V0QmluYXJ5Qnl0ZVVuaXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBnZXREZWNpbWFsQnl0ZVVuaXQ6ICguLi5hcmdzKSA9PiBnZXREZWNpbWFsQnl0ZVVuaXQoLi4uYXJncywgbnVtYnJvKSxcbiAgICBmb3JtYXRPckRlZmF1bHRcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IGVuVVMgPSByZXF1aXJlKFwiLi9lbi1VU1wiKTtcbmNvbnN0IHZhbGlkYXRpbmcgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgcGFyc2luZyA9IHJlcXVpcmUoXCIuL3BhcnNpbmdcIik7XG5cbmxldCBzdGF0ZSA9IHt9O1xuXG5sZXQgY3VycmVudExhbmd1YWdlVGFnID0gdW5kZWZpbmVkO1xubGV0IGxhbmd1YWdlcyA9IHt9O1xuXG5sZXQgemVyb0Zvcm1hdCA9IG51bGw7XG5cbmxldCBnbG9iYWxEZWZhdWx0cyA9IHt9O1xuXG5mdW5jdGlvbiBjaG9vc2VMYW5ndWFnZSh0YWcpIHsgY3VycmVudExhbmd1YWdlVGFnID0gdGFnOyB9XG5cbmZ1bmN0aW9uIGN1cnJlbnRMYW5ndWFnZURhdGEoKSB7IHJldHVybiBsYW5ndWFnZXNbY3VycmVudExhbmd1YWdlVGFnXTsgfVxuXG4vKipcbiAqIFJldHVybiBhbGwgdGhlIHJlZ2lzdGVyIGxhbmd1YWdlc1xuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5sYW5ndWFnZXMgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBsYW5ndWFnZXMpO1xuXG4vL1xuLy8gQ3VycmVudCBsYW5ndWFnZSBhY2Nlc3NvcnNcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIHRhZ1xuICpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuc3RhdGUuY3VycmVudExhbmd1YWdlID0gKCkgPT4gY3VycmVudExhbmd1YWdlVGFnO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBieXRlcyBkYXRhXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRCeXRlcyA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5ieXRlcyB8fCB7fTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgY3VycmVuY3kgZGF0YVxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50Q3VycmVuY3kgPSAoKSA9PiBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkuY3VycmVuY3k7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGxhbmd1YWdlIGFiYnJldmlhdGlvbnMgZGF0YVxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50QWJicmV2aWF0aW9ucyA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5hYmJyZXZpYXRpb25zO1xuXG4vKipcbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBkZWxpbWl0ZXJzIGRhdGFcbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudERlbGltaXRlcnMgPSAoKSA9PiBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkuZGVsaW1pdGVycztcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGN1cnJlbnQgbGFuZ3VhZ2Ugb3JkaW5hbCBmdW5jdGlvblxuICpcbiAqIEByZXR1cm4ge2Z1bmN0aW9ufVxuICovXG5zdGF0ZS5jdXJyZW50T3JkaW5hbCA9ICgpID0+IGN1cnJlbnRMYW5ndWFnZURhdGEoKS5vcmRpbmFsO1xuXG4vL1xuLy8gRGVmYXVsdHNcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW50IGZvcm1hdHRpbmcgZGVmYXVsdHMuXG4gKiBGaXJzdCB1c2UgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgZ2xvYmFsbHkgZGVmaW5lZCBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudERlZmF1bHRzID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudExhbmd1YWdlRGF0YSgpLmRlZmF1bHRzLCBnbG9iYWxEZWZhdWx0cyk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBvcmRpbmFsIGRlZmF1bHQtZm9ybWF0LlxuICogRmlyc3QgdXNlIHRoZSBjdXJyZW50IGxhbmd1YWdlIG9yZGluYWwgZGVmYXVsdCwgdGhlbiBmYWxsYmFjayB0byB0aGUgcmVndWxhciBkZWZhdWx0cy5cbiAqXG4gKiBAcmV0dXJuIHt7fX1cbiAqL1xuc3RhdGUuY3VycmVudE9yZGluYWxEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5vcmRpbmFsRm9ybWF0KTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGJ5dGUgZGVmYXVsdC1mb3JtYXQuXG4gKiBGaXJzdCB1c2UgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgYnl0ZSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50Qnl0ZURlZmF1bHRGb3JtYXQgPSAoKSA9PiBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5jdXJyZW50RGVmYXVsdHMoKSwgY3VycmVudExhbmd1YWdlRGF0YSgpLmJ5dGVGb3JtYXQpO1xuXG4vKipcbiAqIFJldHVybiB0aGUgcGVyY2VudGFnZSBkZWZhdWx0LWZvcm1hdC5cbiAqIEZpcnN0IHVzZSB0aGUgY3VycmVudCBsYW5ndWFnZSBwZXJjZW50YWdlIGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIHJlZ3VsYXIgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRQZXJjZW50YWdlRGVmYXVsdEZvcm1hdCA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmN1cnJlbnREZWZhdWx0cygpLCBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkucGVyY2VudGFnZUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBjdXJyZW5jeSBkZWZhdWx0LWZvcm1hdC5cbiAqIEZpcnN0IHVzZSB0aGUgY3VycmVudCBsYW5ndWFnZSBjdXJyZW5jeSBkZWZhdWx0LCB0aGVuIGZhbGxiYWNrIHRvIHRoZSByZWd1bGFyIGRlZmF1bHRzLlxuICpcbiAqIEByZXR1cm4ge3t9fVxuICovXG5zdGF0ZS5jdXJyZW50Q3VycmVuY3lEZWZhdWx0Rm9ybWF0ID0gKCkgPT4gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuY3VycmVudERlZmF1bHRzKCksIGN1cnJlbnRMYW5ndWFnZURhdGEoKS5jdXJyZW5jeUZvcm1hdCk7XG5cbi8qKlxuICogUmV0dXJuIHRoZSB0aW1lIGRlZmF1bHQtZm9ybWF0LlxuICogRmlyc3QgdXNlIHRoZSBjdXJyZW50IGxhbmd1YWdlIGN1cnJlbmN5IGRlZmF1bHQsIHRoZW4gZmFsbGJhY2sgdG8gdGhlIHJlZ3VsYXIgZGVmYXVsdHMuXG4gKlxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmN1cnJlbnRUaW1lRGVmYXVsdEZvcm1hdCA9ICgpID0+IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmN1cnJlbnREZWZhdWx0cygpLCBjdXJyZW50TGFuZ3VhZ2VEYXRhKCkudGltZUZvcm1hdCk7XG5cbi8qKlxuICogU2V0IHRoZSBnbG9iYWwgZm9ybWF0dGluZyBkZWZhdWx0cy5cbiAqXG4gKiBAcGFyYW0ge3t9fHN0cmluZ30gZm9ybWF0IC0gZm9ybWF0dGluZyBvcHRpb25zIHRvIHVzZSBhcyBkZWZhdWx0c1xuICovXG5zdGF0ZS5zZXREZWZhdWx0cyA9IChmb3JtYXQpID0+IHtcbiAgICBmb3JtYXQgPSBwYXJzaW5nLnBhcnNlRm9ybWF0KGZvcm1hdCk7XG4gICAgaWYgKHZhbGlkYXRpbmcudmFsaWRhdGVGb3JtYXQoZm9ybWF0KSkge1xuICAgICAgICBnbG9iYWxEZWZhdWx0cyA9IGZvcm1hdDtcbiAgICB9XG59O1xuXG4vL1xuLy8gWmVybyBmb3JtYXRcbi8vXG5cbi8qKlxuICogUmV0dXJuIHRoZSBmb3JtYXQgc3RyaW5nIGZvciAwLlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuc3RhdGUuZ2V0WmVyb0Zvcm1hdCA9ICgpID0+IHplcm9Gb3JtYXQ7XG5cbi8qKlxuICogU2V0IGEgU1RSSU5HIHRvIG91dHB1dCB3aGVuIHRoZSB2YWx1ZSBpcyAwLlxuICpcbiAqIEBwYXJhbSB7e318c3RyaW5nfSBzdHJpbmcgLSBzdHJpbmcgdG8gc2V0XG4gKi9cbnN0YXRlLnNldFplcm9Gb3JtYXQgPSAoc3RyaW5nKSA9PiB6ZXJvRm9ybWF0ID0gdHlwZW9mKHN0cmluZykgPT09IFwic3RyaW5nXCIgPyBzdHJpbmcgOiBudWxsO1xuXG4vKipcbiAqIFJldHVybiB0cnVlIGlmIGEgZm9ybWF0IGZvciAwIGhhcyBiZWVuIHNldCBhbHJlYWR5LlxuICpcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbnN0YXRlLmhhc1plcm9Gb3JtYXQgPSAoKSA9PiB6ZXJvRm9ybWF0ICE9PSBudWxsO1xuXG4vL1xuLy8gR2V0dGVycy9TZXR0ZXJzXG4vL1xuXG4vKipcbiAqIFJldHVybiB0aGUgbGFuZ3VhZ2UgZGF0YSBmb3IgdGhlIHByb3ZpZGVkIFRBRy5cbiAqIFJldHVybiB0aGUgY3VycmVudCBsYW5ndWFnZSBkYXRhIGlmIG5vIHRhZyBpcyBwcm92aWRlZC5cbiAqXG4gKiBUaHJvdyBhbiBlcnJvciBpZiB0aGUgdGFnIGRvZXNuJ3QgbWF0Y2ggYW55IHJlZ2lzdGVyZWQgbGFuZ3VhZ2UuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFt0YWddIC0gbGFuZ3VhZ2UgdGFnIG9mIGEgcmVnaXN0ZXJlZCBsYW5ndWFnZVxuICogQHJldHVybiB7e319XG4gKi9cbnN0YXRlLmxhbmd1YWdlRGF0YSA9ICh0YWcpID0+IHtcbiAgICBpZiAodGFnKSB7XG4gICAgICAgIGlmIChsYW5ndWFnZXNbdGFnXSkge1xuICAgICAgICAgICAgcmV0dXJuIGxhbmd1YWdlc1t0YWddO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0YWcgXCIke3RhZ31cImApO1xuICAgIH1cblxuICAgIHJldHVybiBjdXJyZW50TGFuZ3VhZ2VEYXRhKCk7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIHRoZSBwcm92aWRlZCBEQVRBIGFzIGEgbGFuZ3VhZ2UgaWYgYW5kIG9ubHkgaWYgdGhlIGRhdGEgaXMgdmFsaWQuXG4gKiBJZiB0aGUgZGF0YSBpcyBub3QgdmFsaWQsIGFuIGVycm9yIGlzIHRocm93bi5cbiAqXG4gKiBXaGVuIFVTRUxBTkdVQUdFIGlzIHRydWUsIHRoZSByZWdpc3RlcmVkIGxhbmd1YWdlIGlzIHRoZW4gdXNlZC5cbiAqXG4gKiBAcGFyYW0ge3t9fSBkYXRhIC0gbGFuZ3VhZ2UgZGF0YSB0byByZWdpc3RlclxuICogQHBhcmFtIHtib29sZWFufSBbdXNlTGFuZ3VhZ2VdIC0gYHRydWVgIGlmIHRoZSBwcm92aWRlZCBkYXRhIHNob3VsZCBiZWNvbWUgdGhlIGN1cnJlbnQgbGFuZ3VhZ2VcbiAqL1xuc3RhdGUucmVnaXN0ZXJMYW5ndWFnZSA9IChkYXRhLCB1c2VMYW5ndWFnZSA9IGZhbHNlKSA9PiB7XG4gICAgaWYgKCF2YWxpZGF0aW5nLnZhbGlkYXRlTGFuZ3VhZ2UoZGF0YSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBsYW5ndWFnZSBkYXRhXCIpO1xuICAgIH1cblxuICAgIGxhbmd1YWdlc1tkYXRhLmxhbmd1YWdlVGFnXSA9IGRhdGE7XG5cbiAgICBpZiAodXNlTGFuZ3VhZ2UpIHtcbiAgICAgICAgY2hvb3NlTGFuZ3VhZ2UoZGF0YS5sYW5ndWFnZVRhZyk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBTZXQgdGhlIGN1cnJlbnQgbGFuZ3VhZ2UgYWNjb3JkaW5nIHRvIFRBRy5cbiAqIElmIFRBRyBkb2Vzbid0IG1hdGNoIGEgcmVnaXN0ZXJlZCBsYW5ndWFnZSwgYW5vdGhlciBsYW5ndWFnZSBtYXRjaGluZ1xuICogdGhlIFwibGFuZ3VhZ2VcIiBwYXJ0IG9mIHRoZSB0YWcgKGFjY29yZGluZyB0byBCQ1A0NzogaHR0cHM6Ly90b29scy5pZXRmLm9yZy9yZmMvYmNwL2JjcDQ3LnR4dCkuXG4gKiBJZiBub25lLCB0aGUgRkFMTEJBQ0tUQUcgaXMgdXNlZC4gSWYgdGhlIEZBTExCQUNLVEFHIGRvZXNuJ3QgbWF0Y2ggYSByZWdpc3RlciBsYW5ndWFnZSxcbiAqIGBlbi1VU2AgaXMgZmluYWxseSB1c2VkLlxuICpcbiAqIEBwYXJhbSB0YWdcbiAqIEBwYXJhbSBmYWxsYmFja1RhZ1xuICovXG5zdGF0ZS5zZXRMYW5ndWFnZSA9ICh0YWcsIGZhbGxiYWNrVGFnID0gZW5VUy5sYW5ndWFnZVRhZykgPT4ge1xuICAgIGlmICghbGFuZ3VhZ2VzW3RhZ10pIHtcbiAgICAgICAgbGV0IHN1ZmZpeCA9IHRhZy5zcGxpdChcIi1cIilbMF07XG5cbiAgICAgICAgbGV0IG1hdGNoaW5nTGFuZ3VhZ2VUYWcgPSBPYmplY3Qua2V5cyhsYW5ndWFnZXMpLmZpbmQoZWFjaCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZWFjaC5zcGxpdChcIi1cIilbMF0gPT09IHN1ZmZpeDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFsYW5ndWFnZXNbbWF0Y2hpbmdMYW5ndWFnZVRhZ10pIHtcbiAgICAgICAgICAgIGNob29zZUxhbmd1YWdlKGZhbGxiYWNrVGFnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNob29zZUxhbmd1YWdlKG1hdGNoaW5nTGFuZ3VhZ2VUYWcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY2hvb3NlTGFuZ3VhZ2UodGFnKTtcbn07XG5cbnN0YXRlLnJlZ2lzdGVyTGFuZ3VhZ2UoZW5VUyk7XG5jdXJyZW50TGFuZ3VhZ2VUYWcgPSBlblVTLmxhbmd1YWdlVGFnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRlO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogTG9hZCBsYW5ndWFnZXMgbWF0Y2hpbmcgVEFHUy4gU2lsZW50bHkgcGFzcyBvdmVyIHRoZSBmYWlsaW5nIGxvYWQuXG4gKlxuICogV2UgYXNzdW1lIGhlcmUgdGhhdCB3ZSBhcmUgaW4gYSBub2RlIGVudmlyb25tZW50LCBzbyB3ZSBkb24ndCBjaGVjayBmb3IgaXQuXG4gKiBAcGFyYW0ge1tTdHJpbmddfSB0YWdzIC0gbGlzdCBvZiB0YWdzIHRvIGxvYWRcbiAqIEBwYXJhbSB7TnVtYnJvfSBudW1icm8gLSB0aGUgbnVtYnJvIHNpbmdsZXRvblxuICovXG5mdW5jdGlvbiBsb2FkTGFuZ3VhZ2VzSW5Ob2RlKHRhZ3MsIG51bWJybykge1xuICAgIHRhZ3MuZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICAgIGxldCBkYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGF0YSA9IHJlcXVpcmUoYC4uL2xhbmd1YWdlcy8ke3RhZ31gKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5hYmxlIHRvIGxvYWQgXCIke3RhZ31cIi4gTm8gbWF0Y2hpbmcgbGFuZ3VhZ2UgZmlsZSBmb3VuZC5gKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgbnVtYnJvLnJlZ2lzdGVyTGFuZ3VhZ2UoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSAobnVtYnJvKSA9PiAoe1xuICAgIGxvYWRMYW5ndWFnZXNJbk5vZGU6ICh0YWdzKSA9PiBsb2FkTGFuZ3VhZ2VzSW5Ob2RlKHRhZ3MsIG51bWJybylcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IEJpZ051bWJlciA9IHJlcXVpcmUoXCJiaWdudW1iZXIuanNcIik7XG5cbi8qKlxuICogQWRkIGEgbnVtYmVyIG9yIGEgbnVtYnJvIHRvIE4uXG4gKlxuICogQHBhcmFtIHtOdW1icm99IG4gLSBhdWdlbmRcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBhZGRlbmRcbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gYWRkKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUucGx1cyhvdGhlclZhbHVlKS50b051bWJlcigpO1xuICAgIHJldHVybiBuO1xufVxuXG4vKipcbiAqIFN1YnRyYWN0IGEgbnVtYmVyIG9yIGEgbnVtYnJvIGZyb20gTi5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIG1pbnVlbmRcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBzdWJ0cmFoZW5kXG4gKiBAcGFyYW0ge251bWJyb30gbnVtYnJvIC0gbnVtYnJvIHNpbmdsZXRvblxuICogQHJldHVybiB7TnVtYnJvfSBuXG4gKi9cbmZ1bmN0aW9uIHN1YnRyYWN0KG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUubWludXMob3RoZXJWYWx1ZSkudG9OdW1iZXIoKTtcbiAgICByZXR1cm4gbjtcbn1cblxuLyoqXG4gKiBNdWx0aXBseSBOIGJ5IGEgbnVtYmVyIG9yIGEgbnVtYnJvLlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvfSBuIC0gbXVsdGlwbGljYW5kXG4gKiBAcGFyYW0ge251bWJlcnxOdW1icm99IG90aGVyIC0gbXVsdGlwbGllclxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge051bWJyb30gblxuICovXG5mdW5jdGlvbiBtdWx0aXBseShuLCBvdGhlciwgbnVtYnJvKSB7XG4gICAgbGV0IHZhbHVlID0gbmV3IEJpZ051bWJlcihuLl92YWx1ZSk7XG4gICAgbGV0IG90aGVyVmFsdWUgPSBvdGhlcjtcblxuICAgIGlmIChudW1icm8uaXNOdW1icm8ob3RoZXIpKSB7XG4gICAgICAgIG90aGVyVmFsdWUgPSBvdGhlci5fdmFsdWU7XG4gICAgfVxuXG4gICAgb3RoZXJWYWx1ZSA9IG5ldyBCaWdOdW1iZXIob3RoZXJWYWx1ZSk7XG5cbiAgICBuLl92YWx1ZSA9IHZhbHVlLnRpbWVzKG90aGVyVmFsdWUpLnRvTnVtYmVyKCk7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogRGl2aWRlIE4gYnkgYSBudW1iZXIgb3IgYSBudW1icm8uXG4gKlxuICogQHBhcmFtIHtOdW1icm99IG4gLSBkaXZpZGVuZFxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlciAtIGRpdmlzb3JcbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gZGl2aWRlKG4sIG90aGVyLCBudW1icm8pIHtcbiAgICBsZXQgdmFsdWUgPSBuZXcgQmlnTnVtYmVyKG4uX3ZhbHVlKTtcbiAgICBsZXQgb3RoZXJWYWx1ZSA9IG90aGVyO1xuXG4gICAgaWYgKG51bWJyby5pc051bWJybyhvdGhlcikpIHtcbiAgICAgICAgb3RoZXJWYWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBvdGhlclZhbHVlID0gbmV3IEJpZ051bWJlcihvdGhlclZhbHVlKTtcblxuICAgIG4uX3ZhbHVlID0gdmFsdWUuZGl2aWRlZEJ5KG90aGVyVmFsdWUpLnRvTnVtYmVyKCk7XG4gICAgcmV0dXJuIG47XG59XG5cbi8qKlxuICogU2V0IE4gdG8gdGhlIE9USEVSIChvciB0aGUgdmFsdWUgb2YgT1RIRVIgd2hlbiBpdCdzIGEgbnVtYnJvIGluc3RhbmNlKS5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gbiAtIG51bWJybyBpbnN0YW5jZSB0byBtdXRhdGVcbiAqIEBwYXJhbSB7bnVtYmVyfE51bWJyb30gb3RoZXIgLSBuZXcgdmFsdWUgdG8gYXNzaWduIHRvIE5cbiAqIEBwYXJhbSB7bnVtYnJvfSBudW1icm8gLSBudW1icm8gc2luZ2xldG9uXG4gKiBAcmV0dXJuIHtOdW1icm99IG5cbiAqL1xuZnVuY3Rpb24gc2V0IChuLCBvdGhlciwgbnVtYnJvKSB7XG4gICAgbGV0IHZhbHVlID0gb3RoZXI7XG5cbiAgICBpZiAobnVtYnJvLmlzTnVtYnJvKG90aGVyKSkge1xuICAgICAgICB2YWx1ZSA9IG90aGVyLl92YWx1ZTtcbiAgICB9XG5cbiAgICBuLl92YWx1ZSA9IHZhbHVlO1xuICAgIHJldHVybiBuO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgZGlzdGFuY2UgYmV0d2VlbiBOIGFuZCBPVEhFUi5cbiAqXG4gKiBAcGFyYW0ge051bWJyb30gblxuICogQHBhcmFtIHtudW1iZXJ8TnVtYnJvfSBvdGhlclxuICogQHBhcmFtIHtudW1icm99IG51bWJybyAtIG51bWJybyBzaW5nbGV0b25cbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gZGlmZmVyZW5jZShuLCBvdGhlciwgbnVtYnJvKSB7XG4gICAgbGV0IGNsb25lID0gbnVtYnJvKG4uX3ZhbHVlKTtcbiAgICBzdWJ0cmFjdChjbG9uZSwgb3RoZXIsIG51bWJybyk7XG5cbiAgICByZXR1cm4gTWF0aC5hYnMoY2xvbmUuX3ZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBudW1icm8gPT4gKHtcbiAgICBhZGQ6IChuLCBvdGhlcikgPT4gYWRkKG4sIG90aGVyLCBudW1icm8pLFxuICAgIHN1YnRyYWN0OiAobiwgb3RoZXIpID0+IHN1YnRyYWN0KG4sIG90aGVyLCBudW1icm8pLFxuICAgIG11bHRpcGx5OiAobiwgb3RoZXIpID0+IG11bHRpcGx5KG4sIG90aGVyLCBudW1icm8pLFxuICAgIGRpdmlkZTogKG4sIG90aGVyKSA9PiBkaXZpZGUobiwgb3RoZXIsIG51bWJybyksXG4gICAgc2V0OiAobiwgb3RoZXIpID0+IHNldChuLCBvdGhlciwgbnVtYnJvKSxcbiAgICBkaWZmZXJlbmNlOiAobiwgb3RoZXIpID0+IGRpZmZlcmVuY2Uobiwgb3RoZXIsIG51bWJybyksXG4gICAgQmlnTnVtYmVyOiBCaWdOdW1iZXJcbn0pO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmNvbnN0IFZFUlNJT04gPSBcIjIuMy41XCI7XG5cbmNvbnN0IGdsb2JhbFN0YXRlID0gcmVxdWlyZShcIi4vZ2xvYmFsU3RhdGVcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi92YWxpZGF0aW5nXCIpO1xuY29uc3QgbG9hZGVyID0gcmVxdWlyZShcIi4vbG9hZGluZ1wiKShudW1icm8pO1xuY29uc3QgdW5mb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi91bmZvcm1hdHRpbmdcIik7XG5sZXQgZm9ybWF0dGVyID0gcmVxdWlyZShcIi4vZm9ybWF0dGluZ1wiKShudW1icm8pO1xubGV0IG1hbmlwdWxhdGUgPSByZXF1aXJlKFwiLi9tYW5pcHVsYXRpbmdcIikobnVtYnJvKTtcbmNvbnN0IHBhcnNpbmcgPSByZXF1aXJlKFwiLi9wYXJzaW5nXCIpO1xuXG5jbGFzcyBOdW1icm8ge1xuICAgIGNvbnN0cnVjdG9yKG51bWJlcikge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG51bWJlcjtcbiAgICB9XG5cbiAgICBjbG9uZSgpIHsgcmV0dXJuIG51bWJybyh0aGlzLl92YWx1ZSk7IH1cblxuICAgIGZvcm1hdChmb3JtYXQgPSB7fSkgeyByZXR1cm4gZm9ybWF0dGVyLmZvcm1hdCh0aGlzLCBmb3JtYXQpOyB9XG5cbiAgICBmb3JtYXRDdXJyZW5jeShmb3JtYXQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGZvcm1hdCA9IHBhcnNpbmcucGFyc2VGb3JtYXQoZm9ybWF0KTtcbiAgICAgICAgfVxuICAgICAgICBmb3JtYXQgPSBmb3JtYXR0ZXIuZm9ybWF0T3JEZWZhdWx0KGZvcm1hdCwgZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5RGVmYXVsdEZvcm1hdCgpKTtcbiAgICAgICAgZm9ybWF0Lm91dHB1dCA9IFwiY3VycmVuY3lcIjtcbiAgICAgICAgcmV0dXJuIGZvcm1hdHRlci5mb3JtYXQodGhpcywgZm9ybWF0KTtcbiAgICB9XG5cbiAgICBmb3JtYXRUaW1lKGZvcm1hdCA9IHt9KSB7XG4gICAgICAgIGZvcm1hdC5vdXRwdXQgPSBcInRpbWVcIjtcbiAgICAgICAgcmV0dXJuIGZvcm1hdHRlci5mb3JtYXQodGhpcywgZm9ybWF0KTtcbiAgICB9XG5cbiAgICBiaW5hcnlCeXRlVW5pdHMoKSB7IHJldHVybiBmb3JtYXR0ZXIuZ2V0QmluYXJ5Qnl0ZVVuaXQodGhpcyk7fVxuXG4gICAgZGVjaW1hbEJ5dGVVbml0cygpIHsgcmV0dXJuIGZvcm1hdHRlci5nZXREZWNpbWFsQnl0ZVVuaXQodGhpcyk7fVxuXG4gICAgYnl0ZVVuaXRzKCkgeyByZXR1cm4gZm9ybWF0dGVyLmdldEJ5dGVVbml0KHRoaXMpO31cblxuICAgIGRpZmZlcmVuY2Uob3RoZXIpIHsgcmV0dXJuIG1hbmlwdWxhdGUuZGlmZmVyZW5jZSh0aGlzLCBvdGhlcik7IH1cblxuICAgIGFkZChvdGhlcikgeyByZXR1cm4gbWFuaXB1bGF0ZS5hZGQodGhpcywgb3RoZXIpOyB9XG5cbiAgICBzdWJ0cmFjdChvdGhlcikgeyByZXR1cm4gbWFuaXB1bGF0ZS5zdWJ0cmFjdCh0aGlzLCBvdGhlcik7IH1cblxuICAgIG11bHRpcGx5KG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLm11bHRpcGx5KHRoaXMsIG90aGVyKTsgfVxuXG4gICAgZGl2aWRlKG90aGVyKSB7IHJldHVybiBtYW5pcHVsYXRlLmRpdmlkZSh0aGlzLCBvdGhlcik7IH1cblxuICAgIHNldChpbnB1dCkgeyByZXR1cm4gbWFuaXB1bGF0ZS5zZXQodGhpcywgbm9ybWFsaXplSW5wdXQoaW5wdXQpKTsgfVxuXG4gICAgdmFsdWUoKSB7IHJldHVybiB0aGlzLl92YWx1ZTsgfVxuXG4gICAgdmFsdWVPZigpIHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XG59XG5cbi8qKlxuICogTWFrZSBpdHMgYmVzdCB0byBjb252ZXJ0IGlucHV0IGludG8gYSBudW1iZXIuXG4gKlxuICogQHBhcmFtIHtudW1icm98c3RyaW5nfG51bWJlcn0gaW5wdXQgLSBJbnB1dCB0byBjb252ZXJ0XG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUlucHV0KGlucHV0KSB7XG4gICAgbGV0IHJlc3VsdCA9IGlucHV0O1xuICAgIGlmIChudW1icm8uaXNOdW1icm8oaW5wdXQpKSB7XG4gICAgICAgIHJlc3VsdCA9IGlucHV0Ll92YWx1ZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXN1bHQgPSBudW1icm8udW5mb3JtYXQoaW5wdXQpO1xuICAgIH0gZWxzZSBpZiAoaXNOYU4oaW5wdXQpKSB7XG4gICAgICAgIHJlc3VsdCA9IE5hTjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBudW1icm8oaW5wdXQpIHtcbiAgICByZXR1cm4gbmV3IE51bWJybyhub3JtYWxpemVJbnB1dChpbnB1dCkpO1xufVxuXG5udW1icm8udmVyc2lvbiA9IFZFUlNJT047XG5cbm51bWJyby5pc051bWJybyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBOdW1icm87XG59O1xuXG4vL1xuLy8gYG51bWJyb2Agc3RhdGljIG1ldGhvZHNcbi8vXG5cbm51bWJyby5sYW5ndWFnZSA9IGdsb2JhbFN0YXRlLmN1cnJlbnRMYW5ndWFnZTtcbm51bWJyby5yZWdpc3Rlckxhbmd1YWdlID0gZ2xvYmFsU3RhdGUucmVnaXN0ZXJMYW5ndWFnZTtcbm51bWJyby5zZXRMYW5ndWFnZSA9IGdsb2JhbFN0YXRlLnNldExhbmd1YWdlO1xubnVtYnJvLmxhbmd1YWdlcyA9IGdsb2JhbFN0YXRlLmxhbmd1YWdlcztcbm51bWJyby5sYW5ndWFnZURhdGEgPSBnbG9iYWxTdGF0ZS5sYW5ndWFnZURhdGE7XG5udW1icm8uemVyb0Zvcm1hdCA9IGdsb2JhbFN0YXRlLnNldFplcm9Gb3JtYXQ7XG5udW1icm8uZGVmYXVsdEZvcm1hdCA9IGdsb2JhbFN0YXRlLmN1cnJlbnREZWZhdWx0cztcbm51bWJyby5zZXREZWZhdWx0cyA9IGdsb2JhbFN0YXRlLnNldERlZmF1bHRzO1xubnVtYnJvLmRlZmF1bHRDdXJyZW5jeUZvcm1hdCA9IGdsb2JhbFN0YXRlLmN1cnJlbnRDdXJyZW5jeURlZmF1bHRGb3JtYXQ7XG5udW1icm8udmFsaWRhdGUgPSB2YWxpZGF0b3IudmFsaWRhdGU7XG5udW1icm8ubG9hZExhbmd1YWdlc0luTm9kZSA9IGxvYWRlci5sb2FkTGFuZ3VhZ2VzSW5Ob2RlO1xubnVtYnJvLnVuZm9ybWF0ID0gdW5mb3JtYXR0ZXIudW5mb3JtYXQ7XG5udW1icm8uQmlnTnVtYmVyID0gbWFuaXB1bGF0ZS5CaWdOdW1iZXI7XG5cbm1vZHVsZS5leHBvcnRzID0gbnVtYnJvO1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgYSBwcmVmaXguIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlUHJlZml4KHN0cmluZywgcmVzdWx0KSB7XG4gICAgbGV0IG1hdGNoID0gc3RyaW5nLm1hdGNoKC9eeyhbXn1dKil9Lyk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIHJlc3VsdC5wcmVmaXggPSBtYXRjaFsxXTtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5zbGljZShtYXRjaFswXS5sZW5ndGgpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgYSBwb3N0Zml4LiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZVBvc3RmaXgoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBsZXQgbWF0Y2ggPSBzdHJpbmcubWF0Y2goL3soW159XSopfSQvKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LnBvc3RmaXggPSBtYXRjaFsxXTtcblxuICAgICAgICByZXR1cm4gc3RyaW5nLnNsaWNlKDAsIC1tYXRjaFswXS5sZW5ndGgpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmc7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIG91dHB1dCB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqL1xuZnVuY3Rpb24gcGFyc2VPdXRwdXQoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIkXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQub3V0cHV0ID0gXCJjdXJyZW5jeVwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiJVwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0Lm91dHB1dCA9IFwicGVyY2VudFwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5pbmRleE9mKFwiYmRcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImJ5dGVcIjtcbiAgICAgICAgcmVzdWx0LmJhc2UgPSBcImdlbmVyYWxcIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcImJcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcImJ5dGVcIjtcbiAgICAgICAgcmVzdWx0LmJhc2UgPSBcImJpbmFyeVwiO1xuICAgICAgICByZXR1cm47XG5cbiAgICB9XG5cbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJkXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQub3V0cHV0ID0gXCJieXRlXCI7XG4gICAgICAgIHJlc3VsdC5iYXNlID0gXCJkZWNpbWFsXCI7XG4gICAgICAgIHJldHVybjtcblxuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIjpcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcInRpbWVcIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIm9cIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5vdXRwdXQgPSBcIm9yZGluYWxcIjtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIHRob3VzYW5kIHNlcGFyYXRlZCB2YWx1ZS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VUaG91c2FuZFNlcGFyYXRlZChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIixcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC50aG91c2FuZFNlcGFyYXRlZCA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSBzcGFjZSBzZXBhcmF0ZWQgdmFsdWUuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlU3BhY2VTZXBhcmF0ZWQoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCIgXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuc3BhY2VTZXBhcmF0ZWQgPSB0cnVlO1xuICAgICAgICByZXN1bHQuc3BhY2VTZXBhcmF0ZWRDdXJyZW5jeSA9IHRydWU7XG5cbiAgICAgICAgaWYgKHJlc3VsdC5hdmVyYWdlIHx8IHJlc3VsdC5mb3JjZUF2ZXJhZ2UpIHtcbiAgICAgICAgICAgIHJlc3VsdC5zcGFjZVNlcGFyYXRlZEFiYnJldmlhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgbG9va2luZyBmb3IgdGhlIHRvdGFsIGxlbmd0aC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VUb3RhbExlbmd0aChzdHJpbmcsIHJlc3VsdCkge1xuICAgIGxldCBtYXRjaCA9IHN0cmluZy5tYXRjaCgvWzEtOV0rWzAtOV0qLyk7XG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LnRvdGFsTGVuZ3RoID0gK21hdGNoWzBdO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgY2hhcmFjdGVyaXN0aWMgbGVuZ3RoLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUNoYXJhY3RlcmlzdGljKHN0cmluZywgcmVzdWx0KSB7XG4gICAgbGV0IGNoYXJhY3RlcmlzdGljID0gc3RyaW5nLnNwbGl0KFwiLlwiKVswXTtcbiAgICBsZXQgbWF0Y2ggPSBjaGFyYWN0ZXJpc3RpYy5tYXRjaCgvMCsvKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgcmVzdWx0LmNoYXJhY3RlcmlzdGljID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgbWFudGlzc2EgbGVuZ3RoLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZU1hbnRpc3NhKHN0cmluZywgcmVzdWx0KSB7XG4gICAgbGV0IG1hbnRpc3NhID0gc3RyaW5nLnNwbGl0KFwiLlwiKVsxXTtcbiAgICBpZiAobWFudGlzc2EpIHtcbiAgICAgICAgbGV0IG1hdGNoID0gbWFudGlzc2EubWF0Y2goLzArLyk7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgcmVzdWx0Lm1hbnRpc3NhID0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIGEgdHJpbW1lZCBtYW50aXNzYS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqL1xuZnVuY3Rpb24gcGFyc2VUcmltTWFudGlzc2Eoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBjb25zdCBtYW50aXNzYSA9IHN0cmluZy5zcGxpdChcIi5cIilbMV07XG4gICAgaWYgKG1hbnRpc3NhKSB7XG4gICAgICAgIHJlc3VsdC50cmltTWFudGlzc2EgPSBtYW50aXNzYS5pbmRleE9mKFwiW1wiKSAhPT0gLTE7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIHRoZSBhdmVyYWdlIHZhbHVlLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUF2ZXJhZ2Uoc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLmluZGV4T2YoXCJhXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuYXZlcmFnZSA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGxvb2tpbmcgZm9yIGEgZm9yY2VkIGF2ZXJhZ2UgcHJlY2lzaW9uLiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUZvcmNlQXZlcmFnZShzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIktcIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZUF2ZXJhZ2UgPSBcInRob3VzYW5kXCI7XG4gICAgfSBlbHNlIGlmIChzdHJpbmcuaW5kZXhPZihcIk1cIikgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdC5mb3JjZUF2ZXJhZ2UgPSBcIm1pbGxpb25cIjtcbiAgICB9IGVsc2UgaWYgKHN0cmluZy5pbmRleE9mKFwiQlwiKSAhPT0gLTEpIHtcbiAgICAgICAgcmVzdWx0LmZvcmNlQXZlcmFnZSA9IFwiYmlsbGlvblwiO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nLmluZGV4T2YoXCJUXCIpICE9PSAtMSkge1xuICAgICAgICByZXN1bHQuZm9yY2VBdmVyYWdlID0gXCJ0cmlsbGlvblwiO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBmaW5kaW5nIGlmIHRoZSBtYW50aXNzYSBpcyBvcHRpb25hbC4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqIEByZXR1cm4ge3N0cmluZ30gLSBmb3JtYXRcbiAqL1xuZnVuY3Rpb24gcGFyc2VPcHRpb25hbE1hbnRpc3NhKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5tYXRjaCgvXFxbXFwuXS8pKSB7XG4gICAgICAgIHJlc3VsdC5vcHRpb25hbE1hbnRpc3NhID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHN0cmluZy5tYXRjaCgvXFwuLykpIHtcbiAgICAgICAgcmVzdWx0Lm9wdGlvbmFsTWFudGlzc2EgPSBmYWxzZTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGZvcm1hdCBTVFJJTkcgZmluZGluZyBpZiB0aGUgY2hhcmFjdGVyaXN0aWMgaXMgb3B0aW9uYWwuIEFwcGVuZCBpdCB0byBSRVNVTFQgd2hlbiBmb3VuZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIC0gZm9ybWF0XG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gcmVzdWx0IC0gUmVzdWx0IGFjY3VtdWxhdG9yXG4gKiBAcmV0dXJuIHtzdHJpbmd9IC0gZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIHBhcnNlT3B0aW9uYWxDaGFyYWN0ZXJpc3RpYyhzdHJpbmcsIHJlc3VsdCkge1xuICAgIGlmIChzdHJpbmcuaW5kZXhPZihcIi5cIikgIT09IC0xKSB7XG4gICAgICAgIGxldCBjaGFyYWN0ZXJpc3RpYyA9IHN0cmluZy5zcGxpdChcIi5cIilbMF07XG4gICAgICAgIHJlc3VsdC5vcHRpb25hbENoYXJhY3RlcmlzdGljID0gY2hhcmFjdGVyaXN0aWMuaW5kZXhPZihcIjBcIikgPT09IC0xO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBsb29raW5nIGZvciB0aGUgbmVnYXRpdmUgZm9ybWF0LiBBcHBlbmQgaXQgdG8gUkVTVUxUIHdoZW4gZm91bmQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7c3RyaW5nfSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZU5lZ2F0aXZlKHN0cmluZywgcmVzdWx0KSB7XG4gICAgaWYgKHN0cmluZy5tYXRjaCgvXlxcKz9cXChbXildKlxcKSQvKSkge1xuICAgICAgICByZXN1bHQubmVnYXRpdmUgPSBcInBhcmVudGhlc2lzXCI7XG4gICAgfVxuICAgIGlmIChzdHJpbmcubWF0Y2goL15cXCs/LS8pKSB7XG4gICAgICAgIHJlc3VsdC5uZWdhdGl2ZSA9IFwic2lnblwiO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgZm9ybWF0IFNUUklORyBmaW5kaW5nIGlmIHRoZSBzaWduIGlzIG1hbmRhdG9yeS4gQXBwZW5kIGl0IHRvIFJFU1VMVCB3aGVuIGZvdW5kLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgLSBmb3JtYXRcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSByZXN1bHQgLSBSZXN1bHQgYWNjdW11bGF0b3JcbiAqL1xuZnVuY3Rpb24gcGFyc2VGb3JjZVNpZ24oc3RyaW5nLCByZXN1bHQpIHtcbiAgICBpZiAoc3RyaW5nLm1hdGNoKC9eXFwrLykpIHtcbiAgICAgICAgcmVzdWx0LmZvcmNlU2lnbiA9IHRydWU7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBmb3JtYXQgU1RSSU5HIGFuZCBhY2N1bXVsYXRpbmcgdGhlIHZhbHVlcyBpZSBSRVNVTFQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyAtIGZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IHJlc3VsdCAtIFJlc3VsdCBhY2N1bXVsYXRvclxuICogQHJldHVybiB7TnVtYnJvRm9ybWF0fSAtIGZvcm1hdFxuICovXG5mdW5jdGlvbiBwYXJzZUZvcm1hdChzdHJpbmcsIHJlc3VsdCA9IHt9KSB7XG4gICAgaWYgKHR5cGVvZiBzdHJpbmcgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICB9XG5cbiAgICBzdHJpbmcgPSBwYXJzZVByZWZpeChzdHJpbmcsIHJlc3VsdCk7XG4gICAgc3RyaW5nID0gcGFyc2VQb3N0Zml4KHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU91dHB1dChzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VUb3RhbExlbmd0aChzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VDaGFyYWN0ZXJpc3RpYyhzdHJpbmcsIHJlc3VsdCk7XG4gICAgcGFyc2VPcHRpb25hbENoYXJhY3RlcmlzdGljKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZUF2ZXJhZ2Uoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlRm9yY2VBdmVyYWdlKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU1hbnRpc3NhKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU9wdGlvbmFsTWFudGlzc2Eoc3RyaW5nLCByZXN1bHQpO1xuICAgIHBhcnNlVHJpbU1hbnRpc3NhKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZVRob3VzYW5kU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZVNwYWNlU2VwYXJhdGVkKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZU5lZ2F0aXZlKHN0cmluZywgcmVzdWx0KTtcbiAgICBwYXJzZUZvcmNlU2lnbihzdHJpbmcsIHJlc3VsdCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwYXJzZUZvcm1hdFxufTtcbiIsIi8qIVxuICogQ29weXJpZ2h0IChjKSAyMDE3IEJlbmphbWluIFZhbiBSeXNlZ2hlbTxiZW5qYW1pbkB2YW5yeXNlZ2hlbS5jb20+XG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG5jb25zdCBhbGxTdWZmaXhlcyA9IFtcbiAgICB7a2V5OiBcIlppQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDcpfSxcbiAgICB7a2V5OiBcIlpCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgNyl9LFxuICAgIHtrZXk6IFwiWWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgOCl9LFxuICAgIHtrZXk6IFwiWUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA4KX0sXG4gICAge2tleTogXCJUaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCA0KX0sXG4gICAge2tleTogXCJUQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDQpfSxcbiAgICB7a2V5OiBcIlBpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDUpfSxcbiAgICB7a2V5OiBcIlBCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgNSl9LFxuICAgIHtrZXk6IFwiTWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgMil9LFxuICAgIHtrZXk6IFwiTUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCAyKX0sXG4gICAge2tleTogXCJLaUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDI0LCAxKX0sXG4gICAge2tleTogXCJLQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMDAsIDEpfSxcbiAgICB7a2V5OiBcIkdpQlwiLCBmYWN0b3I6IE1hdGgucG93KDEwMjQsIDMpfSxcbiAgICB7a2V5OiBcIkdCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAwMCwgMyl9LFxuICAgIHtrZXk6IFwiRWlCXCIsIGZhY3RvcjogTWF0aC5wb3coMTAyNCwgNil9LFxuICAgIHtrZXk6IFwiRUJcIiwgZmFjdG9yOiBNYXRoLnBvdygxMDAwLCA2KX0sXG4gICAge2tleTogXCJCXCIsIGZhY3RvcjogMX1cbl07XG5cbi8qKlxuICogR2VuZXJhdGUgYSBSZWdFeHAgd2hlcmUgUyBnZXQgYWxsIFJlZ0V4cCBzcGVjaWZpYyBjaGFyYWN0ZXJzIGVzY2FwZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHMgLSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgUmVnRXhwXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzKSB7XG4gICAgcmV0dXJuIHMucmVwbGFjZSgvWy0vXFxcXF4kKis/LigpfFtcXF17fV0vZywgXCJcXFxcJCZcIik7XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgY29tcHV0ZSB0aGUgdW5mb3JtYXR0ZWQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW2N1cnJlbmN5U3ltYm9sXSAtIHN5bWJvbCB1c2VkIGZvciBjdXJyZW5jeSB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gb3JkaW5hbCAtIGZ1bmN0aW9uIHVzZWQgdG8gZ2VuZXJhdGUgYW4gb3JkaW5hbCBvdXQgb2YgYSBudW1iZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSB6ZXJvRm9ybWF0IC0gc3RyaW5nIHJlcHJlc2VudGluZyB6ZXJvXG4gKiBAcGFyYW0geyp9IGFiYnJldmlhdGlvbnMgLSBhYmJyZXZpYXRpb25zIHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdXNlZCB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoaW5wdXRTdHJpbmcsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sID0gXCJcIiwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KSB7XG4gICAgaWYgKCFpc05hTigraW5wdXRTdHJpbmcpKSB7XG4gICAgICAgIHJldHVybiAraW5wdXRTdHJpbmc7XG4gICAgfVxuXG4gICAgbGV0IHN0cmlwcGVkID0gXCJcIjtcbiAgICAvLyBOZWdhdGl2ZVxuXG4gICAgbGV0IG5ld0lucHV0ID0gaW5wdXRTdHJpbmcucmVwbGFjZSgvKF5bXihdKilcXCgoLiopXFwpKFteKV0qJCkvLCBcIiQxJDIkM1wiKTtcblxuICAgIGlmIChuZXdJbnB1dCAhPT0gaW5wdXRTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIC0xICogY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUobmV3SW5wdXQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpO1xuICAgIH1cblxuICAgIC8vIEJ5dGVcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsU3VmZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHN1ZmZpeCA9IGFsbFN1ZmZpeGVzW2ldO1xuICAgICAgICBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2UoUmVnRXhwKGAoWzAtOSBdKSgke3N1ZmZpeC5rZXl9KSRgKSwgXCIkMVwiKTtcblxuICAgICAgICBpZiAoc3RyaXBwZWQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoc3RyaXBwZWQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpICogc3VmZml4LmZhY3RvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFBlcmNlbnRcblxuICAgIHN0cmlwcGVkID0gaW5wdXRTdHJpbmcucmVwbGFjZShcIiVcIiwgXCJcIik7XG5cbiAgICBpZiAoc3RyaXBwZWQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZShzdHJpcHBlZCwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCkgLyAxMDA7XG4gICAgfVxuXG4gICAgLy8gT3JkaW5hbFxuXG4gICAgbGV0IHBvc3NpYmxlT3JkaW5hbFZhbHVlID0gcGFyc2VGbG9hdChpbnB1dFN0cmluZyk7XG5cbiAgICBpZiAoaXNOYU4ocG9zc2libGVPcmRpbmFsVmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgbGV0IG9yZGluYWxTdHJpbmcgPSBvcmRpbmFsKHBvc3NpYmxlT3JkaW5hbFZhbHVlKTtcbiAgICBpZiAob3JkaW5hbFN0cmluZyAmJiBvcmRpbmFsU3RyaW5nICE9PSBcIi5cIikgeyAvLyBpZiBvcmRpbmFsIGlzIFwiLlwiIGl0IHdpbGwgYmUgY2F1Z2h0IG5leHQgcm91bmQgaW4gdGhlICtpbnB1dFN0cmluZ1xuICAgICAgICBzdHJpcHBlZCA9IGlucHV0U3RyaW5nLnJlcGxhY2UobmV3IFJlZ0V4cChgJHtlc2NhcGVSZWdFeHAob3JkaW5hbFN0cmluZyl9JGApLCBcIlwiKTtcblxuICAgICAgICBpZiAoc3RyaXBwZWQgIT09IGlucHV0U3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcHV0ZVVuZm9ybWF0dGVkVmFsdWUoc3RyaXBwZWQsIGRlbGltaXRlcnMsIGN1cnJlbmN5U3ltYm9sLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQXZlcmFnZVxuXG4gICAgbGV0IGludmVyc2VkQWJicmV2aWF0aW9ucyA9IHt9O1xuICAgIE9iamVjdC5rZXlzKGFiYnJldmlhdGlvbnMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICBpbnZlcnNlZEFiYnJldmlhdGlvbnNbYWJicmV2aWF0aW9uc1trZXldXSA9IGtleTtcbiAgICB9KTtcblxuICAgIGxldCBhYmJyZXZpYXRpb25WYWx1ZXMgPSBPYmplY3Qua2V5cyhpbnZlcnNlZEFiYnJldmlhdGlvbnMpLnNvcnQoKS5yZXZlcnNlKCk7XG4gICAgbGV0IG51bWJlck9mQWJicmV2aWF0aW9ucyA9IGFiYnJldmlhdGlvblZhbHVlcy5sZW5ndGg7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bWJlck9mQWJicmV2aWF0aW9uczsgaSsrKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IGFiYnJldmlhdGlvblZhbHVlc1tpXTtcbiAgICAgICAgbGV0IGtleSA9IGludmVyc2VkQWJicmV2aWF0aW9uc1t2YWx1ZV07XG5cbiAgICAgICAgc3RyaXBwZWQgPSBpbnB1dFN0cmluZy5yZXBsYWNlKHZhbHVlLCBcIlwiKTtcbiAgICAgICAgaWYgKHN0cmlwcGVkICE9PSBpbnB1dFN0cmluZykge1xuICAgICAgICAgICAgbGV0IGZhY3RvciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHN3aXRjaCAoa2V5KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZGVmYXVsdC1jYXNlXG4gICAgICAgICAgICAgICAgY2FzZSBcInRob3VzYW5kXCI6XG4gICAgICAgICAgICAgICAgICAgIGZhY3RvciA9IE1hdGgucG93KDEwLCAzKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm1pbGxpb25cIjpcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yID0gTWF0aC5wb3coMTAsIDYpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiYmlsbGlvblwiOlxuICAgICAgICAgICAgICAgICAgICBmYWN0b3IgPSBNYXRoLnBvdygxMCwgOSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJ0cmlsbGlvblwiOlxuICAgICAgICAgICAgICAgICAgICBmYWN0b3IgPSBNYXRoLnBvdygxMCwgMTIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb21wdXRlVW5mb3JtYXR0ZWRWYWx1ZShzdHJpcHBlZCwgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCkgKiBmYWN0b3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgaW4gb25lIHBhc3MgYWxsIGZvcm1hdHRpbmcgc3ltYm9scy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRTdHJpbmcgLSBzdHJpbmcgdG8gdW5mb3JtYXRcbiAqIEBwYXJhbSB7Kn0gZGVsaW1pdGVycyAtIERlbGltaXRlcnMgdXNlZCB0byBnZW5lcmF0ZSB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY3VycmVuY3lTeW1ib2xdIC0gc3ltYm9sIHVzZWQgZm9yIGN1cnJlbmN5IHdoaWxlIGdlbmVyYXRpbmcgdGhlIGlucHV0U3RyaW5nXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUZvcm1hdHRpbmdTeW1ib2xzKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCA9IFwiXCIpIHtcbiAgICAvLyBDdXJyZW5jeVxuXG4gICAgbGV0IHN0cmlwcGVkID0gaW5wdXRTdHJpbmcucmVwbGFjZShjdXJyZW5jeVN5bWJvbCwgXCJcIik7XG5cbiAgICAvLyBUaG91c2FuZCBzZXBhcmF0b3JzXG5cbiAgICBzdHJpcHBlZCA9IHN0cmlwcGVkLnJlcGxhY2UobmV3IFJlZ0V4cChgKFswLTldKSR7ZXNjYXBlUmVnRXhwKGRlbGltaXRlcnMudGhvdXNhbmRzKX0oWzAtOV0pYCwgXCJnXCIpLCBcIiQxJDJcIik7XG5cbiAgICAvLyBEZWNpbWFsXG5cbiAgICBzdHJpcHBlZCA9IHN0cmlwcGVkLnJlcGxhY2UoZGVsaW1pdGVycy5kZWNpbWFsLCBcIi5cIik7XG5cbiAgICByZXR1cm4gc3RyaXBwZWQ7XG59XG5cbi8qKlxuICogVW5mb3JtYXQgYSBudW1icm8tZ2VuZXJhdGVkIHN0cmluZyB0byByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGlucHV0U3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW2N1cnJlbmN5U3ltYm9sXSAtIHN5bWJvbCB1c2VkIGZvciBjdXJyZW5jeSB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gb3JkaW5hbCAtIGZ1bmN0aW9uIHVzZWQgdG8gZ2VuZXJhdGUgYW4gb3JkaW5hbCBvdXQgb2YgYSBudW1iZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSB6ZXJvRm9ybWF0IC0gc3RyaW5nIHJlcHJlc2VudGluZyB6ZXJvXG4gKiBAcGFyYW0geyp9IGFiYnJldmlhdGlvbnMgLSBhYmJyZXZpYXRpb25zIHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdXNlZCB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7bnVtYmVyfHVuZGVmaW5lZH1cbiAqL1xuZnVuY3Rpb24gdW5mb3JtYXRWYWx1ZShpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wgPSBcIlwiLCBvcmRpbmFsLCB6ZXJvRm9ybWF0LCBhYmJyZXZpYXRpb25zLCBmb3JtYXQpIHtcbiAgICBpZiAoaW5wdXRTdHJpbmcgPT09IFwiXCIpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBaZXJvIEZvcm1hdFxuXG4gICAgaWYgKGlucHV0U3RyaW5nID09PSB6ZXJvRm9ybWF0KSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGxldCB2YWx1ZSA9IHJlbW92ZUZvcm1hdHRpbmdTeW1ib2xzKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCk7XG4gICAgcmV0dXJuIGNvbXB1dGVVbmZvcm1hdHRlZFZhbHVlKHZhbHVlLCBkZWxpbWl0ZXJzLCBjdXJyZW5jeVN5bWJvbCwgb3JkaW5hbCwgemVyb0Zvcm1hdCwgYWJicmV2aWF0aW9ucywgZm9ybWF0KTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgSU5QVVRTVFJJTkcgcmVwcmVzZW50cyBhIHRpbWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIGNoZWNrXG4gKiBAcGFyYW0geyp9IGRlbGltaXRlcnMgLSBEZWxpbWl0ZXJzIHVzZWQgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaW5wdXRTdHJpbmdcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNUaW1lKGlucHV0U3RyaW5nLCBkZWxpbWl0ZXJzKSB7XG4gICAgbGV0IHNlcGFyYXRvcnMgPSBpbnB1dFN0cmluZy5pbmRleE9mKFwiOlwiKSAmJiBkZWxpbWl0ZXJzLnRob3VzYW5kcyAhPT0gXCI6XCI7XG5cbiAgICBpZiAoIXNlcGFyYXRvcnMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBzZWdtZW50cyA9IGlucHV0U3RyaW5nLnNwbGl0KFwiOlwiKTtcbiAgICBpZiAoc2VnbWVudHMubGVuZ3RoICE9PSAzKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgaG91cnMgPSArc2VnbWVudHNbMF07XG4gICAgbGV0IG1pbnV0ZXMgPSArc2VnbWVudHNbMV07XG4gICAgbGV0IHNlY29uZHMgPSArc2VnbWVudHNbMl07XG5cbiAgICByZXR1cm4gIWlzTmFOKGhvdXJzKSAmJiAhaXNOYU4obWludXRlcykgJiYgIWlzTmFOKHNlY29uZHMpO1xufVxuXG4vKipcbiAqIFVuZm9ybWF0IGEgbnVtYnJvLWdlbmVyYXRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIGEgdGltZSB0byByZXRyaWV2ZSB0aGUgb3JpZ2luYWwgdmFsdWUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0U3RyaW5nIC0gc3RyaW5nIHRvIHVuZm9ybWF0XG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIHVuZm9ybWF0VGltZShpbnB1dFN0cmluZykge1xuICAgIGxldCBzZWdtZW50cyA9IGlucHV0U3RyaW5nLnNwbGl0KFwiOlwiKTtcblxuICAgIGxldCBob3VycyA9ICtzZWdtZW50c1swXTtcbiAgICBsZXQgbWludXRlcyA9ICtzZWdtZW50c1sxXTtcbiAgICBsZXQgc2Vjb25kcyA9ICtzZWdtZW50c1syXTtcblxuICAgIHJldHVybiBzZWNvbmRzICsgNjAgKiBtaW51dGVzICsgMzYwMCAqIGhvdXJzO1xufVxuXG4vKipcbiAqIFVuZm9ybWF0IGEgbnVtYnJvLWdlbmVyYXRlZCBzdHJpbmcgdG8gcmV0cmlldmUgdGhlIG9yaWdpbmFsIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFN0cmluZyAtIHN0cmluZyB0byB1bmZvcm1hdFxuICogQHBhcmFtIHtOdW1icm9Gb3JtYXR9IGZvcm1hdCAtIGZvcm1hdCB1c2VkICB3aGlsZSBnZW5lcmF0aW5nIHRoZSBpbnB1dFN0cmluZ1xuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiB1bmZvcm1hdChpbnB1dFN0cmluZywgZm9ybWF0KSB7XG4gICAgLy8gQXZvaWQgY2lyY3VsYXIgcmVmZXJlbmNlc1xuICAgIGNvbnN0IGdsb2JhbFN0YXRlID0gcmVxdWlyZShcIi4vZ2xvYmFsU3RhdGVcIik7XG5cbiAgICBsZXQgZGVsaW1pdGVycyA9IGdsb2JhbFN0YXRlLmN1cnJlbnREZWxpbWl0ZXJzKCk7XG4gICAgbGV0IGN1cnJlbmN5U3ltYm9sID0gZ2xvYmFsU3RhdGUuY3VycmVudEN1cnJlbmN5KCkuc3ltYm9sO1xuICAgIGxldCBvcmRpbmFsID0gZ2xvYmFsU3RhdGUuY3VycmVudE9yZGluYWwoKTtcbiAgICBsZXQgemVyb0Zvcm1hdCA9IGdsb2JhbFN0YXRlLmdldFplcm9Gb3JtYXQoKTtcbiAgICBsZXQgYWJicmV2aWF0aW9ucyA9IGdsb2JhbFN0YXRlLmN1cnJlbnRBYmJyZXZpYXRpb25zKCk7XG5cbiAgICBsZXQgdmFsdWUgPSB1bmRlZmluZWQ7XG5cbiAgICBpZiAodHlwZW9mIGlucHV0U3RyaW5nID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGlmIChtYXRjaGVzVGltZShpbnB1dFN0cmluZywgZGVsaW1pdGVycykpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdW5mb3JtYXRUaW1lKGlucHV0U3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gdW5mb3JtYXRWYWx1ZShpbnB1dFN0cmluZywgZGVsaW1pdGVycywgY3VycmVuY3lTeW1ib2wsIG9yZGluYWwsIHplcm9Gb3JtYXQsIGFiYnJldmlhdGlvbnMsIGZvcm1hdCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dFN0cmluZyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICB2YWx1ZSA9IGlucHV0U3RyaW5nO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHVuZm9ybWF0XG59O1xuIiwiLyohXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQmVuamFtaW4gVmFuIFJ5c2VnaGVtPGJlbmphbWluQHZhbnJ5c2VnaGVtLmNvbT5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbmxldCB1bmZvcm1hdHRlciA9IHJlcXVpcmUoXCIuL3VuZm9ybWF0dGluZ1wiKTtcblxuLy8gU2ltcGxpZmllZCByZWdleHAgc3VwcG9ydGluZyBvbmx5IGBsYW5ndWFnZWAsIGBzY3JpcHRgLCBhbmQgYHJlZ2lvbmBcbmNvbnN0IGJjcDQ3UmVnRXhwID0gL15bYS16XXsyLDN9KC1bYS16QS1aXXs0fSk/KC0oW0EtWl17Mn18WzAtOV17M30pKT8kLztcblxuY29uc3QgdmFsaWRPdXRwdXRWYWx1ZXMgPSBbXG4gICAgXCJjdXJyZW5jeVwiLFxuICAgIFwicGVyY2VudFwiLFxuICAgIFwiYnl0ZVwiLFxuICAgIFwidGltZVwiLFxuICAgIFwib3JkaW5hbFwiLFxuICAgIFwibnVtYmVyXCJcbl07XG5cbmNvbnN0IHZhbGlkRm9yY2VBdmVyYWdlVmFsdWVzID0gW1xuICAgIFwidHJpbGxpb25cIixcbiAgICBcImJpbGxpb25cIixcbiAgICBcIm1pbGxpb25cIixcbiAgICBcInRob3VzYW5kXCJcbl07XG5cbmNvbnN0IHZhbGlkQ3VycmVuY3lQb3NpdGlvbiA9IFtcbiAgICBcInByZWZpeFwiLFxuICAgIFwiaW5maXhcIixcbiAgICBcInBvc3RmaXhcIlxuXTtcblxuY29uc3QgdmFsaWROZWdhdGl2ZVZhbHVlcyA9IFtcbiAgICBcInNpZ25cIixcbiAgICBcInBhcmVudGhlc2lzXCJcbl07XG5cbmNvbnN0IHZhbGlkTWFuZGF0b3J5QWJicmV2aWF0aW9ucyA9IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgIGNoaWxkcmVuOiB7XG4gICAgICAgIHRob3VzYW5kOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIG1pbGxpb246IHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgYmlsbGlvbjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICB0cmlsbGlvbjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSxcbiAgICBtYW5kYXRvcnk6IHRydWVcbn07XG5cbmNvbnN0IHZhbGlkQWJicmV2aWF0aW9ucyA9IHtcbiAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgIGNoaWxkcmVuOiB7XG4gICAgICAgIHRob3VzYW5kOiBcInN0cmluZ1wiLFxuICAgICAgICBtaWxsaW9uOiBcInN0cmluZ1wiLFxuICAgICAgICBiaWxsaW9uOiBcInN0cmluZ1wiLFxuICAgICAgICB0cmlsbGlvbjogXCJzdHJpbmdcIlxuICAgIH1cbn07XG5cbmNvbnN0IHZhbGlkQmFzZVZhbHVlcyA9IFtcbiAgICBcImRlY2ltYWxcIixcbiAgICBcImJpbmFyeVwiLFxuICAgIFwiZ2VuZXJhbFwiXG5dO1xuXG5jb25zdCB2YWxpZEZvcm1hdCA9IHtcbiAgICBvdXRwdXQ6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkT3V0cHV0VmFsdWVzXG4gICAgfSxcbiAgICBiYXNlOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZEJhc2VWYWx1ZXMsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyLCBmb3JtYXQpID0+IGZvcm1hdC5vdXRwdXQgPT09IFwiYnl0ZVwiLFxuICAgICAgICBtZXNzYWdlOiBcImBiYXNlYCBtdXN0IGJlIHByb3ZpZGVkIG9ubHkgd2hlbiB0aGUgb3V0cHV0IGlzIGBieXRlYFwiLFxuICAgICAgICBtYW5kYXRvcnk6IChmb3JtYXQpID0+IGZvcm1hdC5vdXRwdXQgPT09IFwiYnl0ZVwiXG4gICAgfSxcbiAgICBjaGFyYWN0ZXJpc3RpYzoge1xuICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxuICAgICAgICByZXN0cmljdGlvbjogKG51bWJlcikgPT4gbnVtYmVyID49IDAsXG4gICAgICAgIG1lc3NhZ2U6IFwidmFsdWUgbXVzdCBiZSBwb3NpdGl2ZVwiXG4gICAgfSxcbiAgICBwcmVmaXg6IFwic3RyaW5nXCIsXG4gICAgcG9zdGZpeDogXCJzdHJpbmdcIixcbiAgICBmb3JjZUF2ZXJhZ2U6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgdmFsaWRWYWx1ZXM6IHZhbGlkRm9yY2VBdmVyYWdlVmFsdWVzXG4gICAgfSxcbiAgICBhdmVyYWdlOiBcImJvb2xlYW5cIixcbiAgICBsb3dQcmVjaXNpb246IHtcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyLCBmb3JtYXQpID0+IGZvcm1hdC5hdmVyYWdlID09PSB0cnVlLFxuICAgICAgICBtZXNzYWdlOiBcImBsb3dQcmVjaXNpb25gIG11c3QgYmUgcHJvdmlkZWQgb25seSB3aGVuIHRoZSBvcHRpb24gYGF2ZXJhZ2VgIGlzIHNldFwiXG4gICAgfSxcbiAgICBjdXJyZW5jeVBvc2l0aW9uOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZEN1cnJlbmN5UG9zaXRpb25cbiAgICB9LFxuICAgIGN1cnJlbmN5U3ltYm9sOiBcInN0cmluZ1wiLFxuICAgIHRvdGFsTGVuZ3RoOiB7XG4gICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyKSA9PiBudW1iZXIgPj0gMCxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcInZhbHVlIG11c3QgYmUgcG9zaXRpdmVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN0cmljdGlvbjogKG51bWJlciwgZm9ybWF0KSA9PiAhZm9ybWF0LmV4cG9uZW50aWFsLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiYHRvdGFsTGVuZ3RoYCBpcyBpbmNvbXBhdGlibGUgd2l0aCBgZXhwb25lbnRpYWxgXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH0sXG4gICAgbWFudGlzc2E6IHtcbiAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgcmVzdHJpY3Rpb246IChudW1iZXIpID0+IG51bWJlciA+PSAwLFxuICAgICAgICBtZXNzYWdlOiBcInZhbHVlIG11c3QgYmUgcG9zaXRpdmVcIlxuICAgIH0sXG4gICAgb3B0aW9uYWxNYW50aXNzYTogXCJib29sZWFuXCIsXG4gICAgdHJpbU1hbnRpc3NhOiBcImJvb2xlYW5cIixcbiAgICByb3VuZGluZ0Z1bmN0aW9uOiBcImZ1bmN0aW9uXCIsXG4gICAgb3B0aW9uYWxDaGFyYWN0ZXJpc3RpYzogXCJib29sZWFuXCIsXG4gICAgdGhvdXNhbmRTZXBhcmF0ZWQ6IFwiYm9vbGVhblwiLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBcImJvb2xlYW5cIixcbiAgICBzcGFjZVNlcGFyYXRlZEN1cnJlbmN5OiBcImJvb2xlYW5cIixcbiAgICBzcGFjZVNlcGFyYXRlZEFiYnJldmlhdGlvbjogXCJib29sZWFuXCIsXG4gICAgYWJicmV2aWF0aW9uczogdmFsaWRBYmJyZXZpYXRpb25zLFxuICAgIG5lZ2F0aXZlOiB7XG4gICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIHZhbGlkVmFsdWVzOiB2YWxpZE5lZ2F0aXZlVmFsdWVzXG4gICAgfSxcbiAgICBmb3JjZVNpZ246IFwiYm9vbGVhblwiLFxuICAgIGV4cG9uZW50aWFsOiB7XG4gICAgICAgIHR5cGU6IFwiYm9vbGVhblwiXG4gICAgfSxcbiAgICBwcmVmaXhTeW1ib2w6IHtcbiAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgIHJlc3RyaWN0aW9uOiAobnVtYmVyLCBmb3JtYXQpID0+IGZvcm1hdC5vdXRwdXQgPT09IFwicGVyY2VudFwiLFxuICAgICAgICBtZXNzYWdlOiBcImBwcmVmaXhTeW1ib2xgIGNhbiBiZSBwcm92aWRlZCBvbmx5IHdoZW4gdGhlIG91dHB1dCBpcyBgcGVyY2VudGBcIlxuICAgIH1cbn07XG5cbmNvbnN0IHZhbGlkTGFuZ3VhZ2UgPSB7XG4gICAgbGFuZ3VhZ2VUYWc6IHtcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlLFxuICAgICAgICByZXN0cmljdGlvbjogKHRhZykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRhZy5tYXRjaChiY3A0N1JlZ0V4cCk7XG4gICAgICAgIH0sXG4gICAgICAgIG1lc3NhZ2U6IFwidGhlIGxhbmd1YWdlIHRhZyBtdXN0IGZvbGxvdyB0aGUgQkNQIDQ3IHNwZWNpZmljYXRpb24gKHNlZSBodHRwczovL3Rvb2xzLmllZnQub3JnL2h0bWwvYmNwNDcpXCJcbiAgICB9LFxuICAgIGRlbGltaXRlcnM6IHtcbiAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgICAgIHRob3VzYW5kczogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlY2ltYWw6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICB0aG91c2FuZHNTaXplOiBcIm51bWJlclwiXG4gICAgICAgIH0sXG4gICAgICAgIG1hbmRhdG9yeTogdHJ1ZVxuICAgIH0sXG4gICAgYWJicmV2aWF0aW9uczogdmFsaWRNYW5kYXRvcnlBYmJyZXZpYXRpb25zLFxuICAgIHNwYWNlU2VwYXJhdGVkOiBcImJvb2xlYW5cIixcbiAgICBzcGFjZVNlcGFyYXRlZEN1cnJlbmN5OiBcImJvb2xlYW5cIixcbiAgICBvcmRpbmFsOiB7XG4gICAgICAgIHR5cGU6IFwiZnVuY3Rpb25cIixcbiAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgfSxcbiAgICBieXRlczoge1xuICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxuICAgICAgICBjaGlsZHJlbjoge1xuICAgICAgICAgICAgYmluYXJ5U3VmZml4ZXM6IFwib2JqZWN0XCIsXG4gICAgICAgICAgICBkZWNpbWFsU3VmZml4ZXM6IFwib2JqZWN0XCJcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY3VycmVuY3k6IHtcbiAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgY2hpbGRyZW46IHtcbiAgICAgICAgICAgIHN5bWJvbDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgY29kZTogXCJzdHJpbmdcIlxuICAgICAgICB9LFxuICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICB9LFxuICAgIGRlZmF1bHRzOiBcImZvcm1hdFwiLFxuICAgIG9yZGluYWxGb3JtYXQ6IFwiZm9ybWF0XCIsXG4gICAgYnl0ZUZvcm1hdDogXCJmb3JtYXRcIixcbiAgICBwZXJjZW50YWdlRm9ybWF0OiBcImZvcm1hdFwiLFxuICAgIGN1cnJlbmN5Rm9ybWF0OiBcImZvcm1hdFwiLFxuICAgIHRpbWVEZWZhdWx0czogXCJmb3JtYXRcIixcbiAgICBmb3JtYXRzOiB7XG4gICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgIGNoaWxkcmVuOiB7XG4gICAgICAgICAgICBmb3VyRGlnaXRzOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJmb3JtYXRcIixcbiAgICAgICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdWxsV2l0aFR3b0RlY2ltYWxzOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJmb3JtYXRcIixcbiAgICAgICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdWxsV2l0aFR3b0RlY2ltYWxzTm9DdXJyZW5jeToge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZm9ybWF0XCIsXG4gICAgICAgICAgICAgICAgbWFuZGF0b3J5OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVsbFdpdGhOb0RlY2ltYWxzOiB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJmb3JtYXRcIixcbiAgICAgICAgICAgICAgICBtYW5kYXRvcnk6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogQ2hlY2sgdGhlIHZhbGlkaXR5IG9mIHRoZSBwcm92aWRlZCBpbnB1dCBhbmQgZm9ybWF0LlxuICogVGhlIGNoZWNrIGlzIE5PVCBsYXp5LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxOdW1icm99IGlucHV0IC0gaW5wdXQgdG8gY2hlY2tcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdG8gY2hlY2tcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgd2hlbiBldmVyeXRoaW5nIGlzIGNvcnJlY3RcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGUoaW5wdXQsIGZvcm1hdCkge1xuICAgIGxldCB2YWxpZElucHV0ID0gdmFsaWRhdGVJbnB1dChpbnB1dCk7XG4gICAgbGV0IGlzRm9ybWF0VmFsaWQgPSB2YWxpZGF0ZUZvcm1hdChmb3JtYXQpO1xuXG4gICAgcmV0dXJuIHZhbGlkSW5wdXQgJiYgaXNGb3JtYXRWYWxpZDtcbn1cblxuLyoqXG4gKiBDaGVjayB0aGUgdmFsaWRpdHkgb2YgdGhlIG51bWJybyBpbnB1dC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8TnVtYnJvfSBpbnB1dCAtIGlucHV0IHRvIGNoZWNrXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIHdoZW4gZXZlcnl0aGluZyBpcyBjb3JyZWN0XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlSW5wdXQoaW5wdXQpIHtcbiAgICBsZXQgdmFsdWUgPSB1bmZvcm1hdHRlci51bmZvcm1hdChpbnB1dCk7XG5cbiAgICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDaGVjayB0aGUgdmFsaWRpdHkgb2YgdGhlIHByb3ZpZGVkIGZvcm1hdCBUT1ZBTElEQVRFIGFnYWluc3QgU1BFQy5cbiAqXG4gKiBAcGFyYW0ge051bWJyb0Zvcm1hdH0gdG9WYWxpZGF0ZSAtIGZvcm1hdCB0byBjaGVja1xuICogQHBhcmFtIHsqfSBzcGVjIC0gc3BlY2lmaWNhdGlvbiBhZ2FpbnN0IHdoaWNoIHRvIGNoZWNrXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4IC0gcHJlZml4IHVzZSBmb3IgZXJyb3IgbWVzc2FnZXNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc2tpcE1hbmRhdG9yeUNoZWNrIC0gYHRydWVgIHdoZW4gdGhlIGNoZWNrIGZvciBtYW5kYXRvcnkga2V5IG11c3QgYmUgc2tpcHBlZFxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSB3aGVuIGV2ZXJ5dGhpbmcgaXMgY29ycmVjdFxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZVNwZWModG9WYWxpZGF0ZSwgc3BlYywgcHJlZml4LCBza2lwTWFuZGF0b3J5Q2hlY2sgPSBmYWxzZSkge1xuICAgIGxldCByZXN1bHRzID0gT2JqZWN0LmtleXModG9WYWxpZGF0ZSkubWFwKChrZXkpID0+IHtcbiAgICAgICAgaWYgKCFzcGVjW2tleV0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7cHJlZml4fSBJbnZhbGlkIGtleTogJHtrZXl9YCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHZhbHVlID0gdG9WYWxpZGF0ZVtrZXldO1xuICAgICAgICBsZXQgZGF0YSA9IHNwZWNba2V5XTtcblxuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGRhdGEgPSB7dHlwZTogZGF0YX07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS50eXBlID09PSBcImZvcm1hdFwiKSB7IC8vIGFsbCBmb3JtYXRzIGFyZSBwYXJ0aWFsIChhLmsuYSB3aWxsIGJlIG1lcmdlZCB3aXRoIHNvbWUgZGVmYXVsdCB2YWx1ZXMpIHRodXMgbm8gbmVlZCB0byBjaGVjayBtYW5kYXRvcnkgdmFsdWVzXG4gICAgICAgICAgICBsZXQgdmFsaWQgPSB2YWxpZGF0ZVNwZWModmFsdWUsIHZhbGlkRm9ybWF0LCBgW1ZhbGlkYXRlICR7a2V5fV1gLCB0cnVlKTtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9ICR7a2V5fSB0eXBlIG1pc21hdGNoZWQ6IFwiJHtkYXRhLnR5cGV9XCIgZXhwZWN0ZWQsIFwiJHt0eXBlb2YgdmFsdWV9XCIgcHJvdmlkZWRgKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5yZXN0cmljdGlvbnMgJiYgZGF0YS5yZXN0cmljdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBsZXQgbGVuZ3RoID0gZGF0YS5yZXN0cmljdGlvbnMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCB7cmVzdHJpY3Rpb24sIG1lc3NhZ2V9ID0gZGF0YS5yZXN0cmljdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKCFyZXN0cmljdGlvbih2YWx1ZSwgdG9WYWxpZGF0ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9ICR7a2V5fSBpbnZhbGlkIHZhbHVlOiAke21lc3NhZ2V9YCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEucmVzdHJpY3Rpb24gJiYgIWRhdGEucmVzdHJpY3Rpb24odmFsdWUsIHRvVmFsaWRhdGUpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3ByZWZpeH0gJHtrZXl9IGludmFsaWQgdmFsdWU6ICR7ZGF0YS5tZXNzYWdlfWApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnZhbGlkVmFsdWVzICYmIGRhdGEudmFsaWRWYWx1ZXMuaW5kZXhPZih2YWx1ZSkgPT09IC0xKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke3ByZWZpeH0gJHtrZXl9IGludmFsaWQgdmFsdWU6IG11c3QgYmUgYW1vbmcgJHtKU09OLnN0cmluZ2lmeShkYXRhLnZhbGlkVmFsdWVzKX0sIFwiJHt2YWx1ZX1cIiBwcm92aWRlZGApOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICBsZXQgdmFsaWQgPSB2YWxpZGF0ZVNwZWModmFsdWUsIGRhdGEuY2hpbGRyZW4sIGBbVmFsaWRhdGUgJHtrZXl9XWApO1xuXG4gICAgICAgICAgICBpZiAoIXZhbGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICBpZiAoIXNraXBNYW5kYXRvcnlDaGVjaykge1xuICAgICAgICByZXN1bHRzLnB1c2goLi4uT2JqZWN0LmtleXMoc3BlYykubWFwKChrZXkpID0+IHtcbiAgICAgICAgICAgIGxldCBkYXRhID0gc3BlY1trZXldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHt0eXBlOiBkYXRhfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRhdGEubWFuZGF0b3J5KSB7XG4gICAgICAgICAgICAgICAgbGV0IG1hbmRhdG9yeSA9IGRhdGEubWFuZGF0b3J5O1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWFuZGF0b3J5ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFuZGF0b3J5ID0gbWFuZGF0b3J5KHRvVmFsaWRhdGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChtYW5kYXRvcnkgJiYgdG9WYWxpZGF0ZVtrZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgJHtwcmVmaXh9IE1pc3NpbmcgbWFuZGF0b3J5IGtleSBcIiR7a2V5fVwiYCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzLnJlZHVjZSgoYWNjLCBjdXJyZW50KSA9PiB7XG4gICAgICAgIHJldHVybiBhY2MgJiYgY3VycmVudDtcbiAgICB9LCB0cnVlKTtcbn1cblxuLyoqXG4gKiBDaGVjayB0aGUgcHJvdmlkZWQgRk9STUFULlxuICpcbiAqIEBwYXJhbSB7TnVtYnJvRm9ybWF0fSBmb3JtYXQgLSBmb3JtYXQgdG8gY2hlY2tcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlRm9ybWF0KGZvcm1hdCkge1xuICAgIHJldHVybiB2YWxpZGF0ZVNwZWMoZm9ybWF0LCB2YWxpZEZvcm1hdCwgXCJbVmFsaWRhdGUgZm9ybWF0XVwiKTtcbn1cblxuLyoqXG4gKiBDaGVjayB0aGUgcHJvdmlkZWQgTEFOR1VBR0UuXG4gKlxuICogQHBhcmFtIHtOdW1icm9MYW5ndWFnZX0gbGFuZ3VhZ2UgLSBsYW5ndWFnZSB0byBjaGVja1xuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVMYW5ndWFnZShsYW5ndWFnZSkge1xuICAgIHJldHVybiB2YWxpZGF0ZVNwZWMobGFuZ3VhZ2UsIHZhbGlkTGFuZ3VhZ2UsIFwiW1ZhbGlkYXRlIGxhbmd1YWdlXVwiKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdmFsaWRhdGUsXG4gICAgdmFsaWRhdGVGb3JtYXQsXG4gICAgdmFsaWRhdGVJbnB1dCxcbiAgICB2YWxpZGF0ZUxhbmd1YWdlXG59O1xuIl19
