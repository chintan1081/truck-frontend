// Non-deprecated built-in shim for node-domexception utilizing native DOMException
const NativeDOMException = globalThis.DOMException || Error;
module.exports = NativeDOMException;
