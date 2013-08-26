/* Copyright (c) 2013 Billy Tetrud - Free to use for any purpose: MIT License*/

var crypto = require('crypto')
//var ursa = require('ursa') // for rsa encryption

exports.hash = function(algorithm, encoding) {
    return new hasher(algorithm,  encoding)
}
exports.hmac = function(algorithm, encoding) {
    return new hmacer(algorithm,  encoding)
}
// todo: test and check out: http://stackoverflow.com/questions/15004951/nodejs-cant-get-crypto-module-to-give-me-the-right-aes-cipher-outcome
exports.sym = function(algorithm, encoding) {
    return new symmer(algorithm, encoding)
}
exports.ciphers = function() {
    return crypto.getCiphers()
}
exports.hashes = function() {
    return crypto.getHashes()
}

function hasher(algorithm, encoding) {
    this.hasher = crypto.createHash(algorithm)
    this.encoding = encoding
}
    hasher.prototype = {
        enc: function(message) {
            return this.hasher.update(message).digest(this.encoding).toString()
        }
    }

function hmacer(algorithm, encoding) {
    this.algorithm = algorithm
    this.encoding = encoding
}
    hmacer.prototype = {
        enc: function(message, key) {
            var hasher = crypto.createHmac(this.algorithm, key)
            return hasher.update(message).digest(this.encoding).toString()
        }
    }

function symmer(algorithm, encoding) {
    this.algorithm = algorithm
    this.encoding = encoding
}
    symmer.prototype = {
        enc: function(key, message) {
            var enc = crypto.createCipher(this.algorithm, key)
            return enc.update(message, 'utf8', this.encoding).toString() + enc.final(this.encoding)
        },
        dec: function(key, encryptedMessage) {
            var dec = crypto.createDecipher(this.algorithm, key)
            return dec.update(encryptedMessage, this.encoding, 'utf8') + dec.final('utf8')
        }
    }

/*
exports.asym = function() {

}
*/