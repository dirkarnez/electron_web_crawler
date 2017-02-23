 function arrayToNgramArray(array, n) {
     const ngrams = []
     if (array.length < n) return ngrams;
     for (let k =0, i = n; i < array.length; i++, k++) {
     	ngrams.push(array.slice(k, i)) //nativeit is better
     }
     return ngrams;
 }

 module.exports = {
     arrayToNgramArray
 }
