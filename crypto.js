var crypto = require('crypto');

exports.hash = function(algorithm, encoding) {
    var hasher = crypto.createHash(algorithm);
    this.enc = function(message) {
        return hasher.update(message).digest(encoding).toString();
    };
};
exports.sym = function(algorithm, encoding) {
    this.enc = function(key, message) {
        var enc = crypto.createCipher(algorithm, key);
        return enc.update(message, 'utf8', encoding).toString() + enc.final(encoding);
    };
    this.dec = function(key, encryptedMessage) {
        var dec = crypto.createDecipher(algorithm, key);
        return dec.update(encryptedMessage, encoding, 'utf8') + enc.final('utf8');
    };
};
exports.ciphers = function() {
    return crypto.getCiphers();
}
exports.hashes = function() {
    return crypto.getHashes();
}

/*asym: function() {

}*/