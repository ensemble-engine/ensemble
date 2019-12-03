// *** Ensemble 1.1.1 ***
ensemble = (function(){
// MODULE underscore
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,h=e.reduce,v=e.reduceRight,g=e.filter,d=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,w=Object.keys,_=i.bind,j=function(n){return n instanceof j?n:this instanceof j?void(this._wrapped=n):new j(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=j),exports._=j):n._=j,j.VERSION="1.6.0";var A=j.each=j.forEach=function(n,t,e){if(null==n)return n;if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a=j.keys(n),u=0,i=a.length;i>u;u++)if(t.call(e,n[a[u]],a[u],n)===r)return;return n};j.map=j.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e.push(t.call(r,n,u,i))}),e)};var O="Reduce of empty array with no initial value";j.reduce=j.foldl=j.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduce===h)return e&&(t=j.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(O);return r},j.reduceRight=j.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduceRight===v)return e&&(t=j.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=j.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(O);return r},j.find=j.detect=function(n,t,r){var e;return k(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},j.filter=j.select=function(n,t,r){var e=[];return null==n?e:g&&n.filter===g?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&e.push(n)}),e)},j.reject=function(n,t,r){return j.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},j.every=j.all=function(n,t,e){t||(t=j.identity);var u=!0;return null==n?u:d&&n.every===d?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var k=j.some=j.any=function(n,t,e){t||(t=j.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};j.contains=j.include=function(n,t){return null==n?!1:y&&n.indexOf===y?n.indexOf(t)!=-1:k(n,function(n){return n===t})},j.invoke=function(n,t){var r=o.call(arguments,2),e=j.isFunction(t);return j.map(n,function(n){return(e?t:n[t]).apply(n,r)})},j.pluck=function(n,t){return j.map(n,j.property(t))},j.where=function(n,t){return j.filter(n,j.matches(t))},j.findWhere=function(n,t){return j.find(n,j.matches(t))},j.max=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.max.apply(Math,n);var e=-1/0,u=-1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;o>u&&(e=n,u=o)}),e},j.min=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.min.apply(Math,n);var e=1/0,u=1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;u>o&&(e=n,u=o)}),e},j.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=j.random(r++),e[r-1]=e[t],e[t]=n}),e},j.sample=function(n,t,r){return null==t||r?(n.length!==+n.length&&(n=j.values(n)),n[j.random(n.length-1)]):j.shuffle(n).slice(0,Math.max(0,t))};var E=function(n){return null==n?j.identity:j.isFunction(n)?n:j.property(n)};j.sortBy=function(n,t,r){return t=E(t),j.pluck(j.map(n,function(n,e,u){return{value:n,index:e,criteria:t.call(r,n,e,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),"value")};var F=function(n){return function(t,r,e){var u={};return r=E(r),A(t,function(i,a){var o=r.call(e,i,a,t);n(u,o,i)}),u}};j.groupBy=F(function(n,t,r){j.has(n,t)?n[t].push(r):n[t]=[r]}),j.indexBy=F(function(n,t,r){n[t]=r}),j.countBy=F(function(n,t){j.has(n,t)?n[t]++:n[t]=1}),j.sortedIndex=function(n,t,r,e){r=E(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;r.call(e,n[o])<u?i=o+1:a=o}return i},j.toArray=function(n){return n?j.isArray(n)?o.call(n):n.length===+n.length?j.map(n,j.identity):j.values(n):[]},j.size=function(n){return null==n?0:n.length===+n.length?n.length:j.keys(n).length},j.first=j.head=j.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:0>t?[]:o.call(n,0,t)},j.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},j.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},j.rest=j.tail=j.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},j.compact=function(n){return j.filter(n,j.identity)};var M=function(n,t,r){return t&&j.every(n,j.isArray)?c.apply(r,n):(A(n,function(n){j.isArray(n)||j.isArguments(n)?t?a.apply(r,n):M(n,t,r):r.push(n)}),r)};j.flatten=function(n,t){return M(n,t,[])},j.without=function(n){return j.difference(n,o.call(arguments,1))},j.partition=function(n,t){var r=[],e=[];return A(n,function(n){(t(n)?r:e).push(n)}),[r,e]},j.uniq=j.unique=function(n,t,r,e){j.isFunction(t)&&(e=r,r=t,t=!1);var u=r?j.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:j.contains(a,r))||(a.push(r),i.push(n[e]))}),i},j.union=function(){return j.uniq(j.flatten(arguments,!0))},j.intersection=function(n){var t=o.call(arguments,1);return j.filter(j.uniq(n),function(n){return j.every(t,function(t){return j.contains(t,n)})})},j.difference=function(n){var t=c.apply(e,o.call(arguments,1));return j.filter(n,function(n){return!j.contains(t,n)})},j.zip=function(){for(var n=j.max(j.pluck(arguments,"length").concat(0)),t=new Array(n),r=0;n>r;r++)t[r]=j.pluck(arguments,""+r);return t},j.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},j.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=j.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},j.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},j.range=function(n,t,r){arguments.length<=1&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=new Array(e);e>u;)i[u++]=n,n+=r;return i};var R=function(){};j.bind=function(n,t){var r,e;if(_&&n.bind===_)return _.apply(n,o.call(arguments,1));if(!j.isFunction(n))throw new TypeError;return r=o.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(o.call(arguments)));R.prototype=n.prototype;var u=new R;R.prototype=null;var i=n.apply(u,r.concat(o.call(arguments)));return Object(i)===i?i:u}},j.partial=function(n){var t=o.call(arguments,1);return function(){for(var r=0,e=t.slice(),u=0,i=e.length;i>u;u++)e[u]===j&&(e[u]=arguments[r++]);for(;r<arguments.length;)e.push(arguments[r++]);return n.apply(this,e)}},j.bindAll=function(n){var t=o.call(arguments,1);if(0===t.length)throw new Error("bindAll must be passed function names");return A(t,function(t){n[t]=j.bind(n[t],n)}),n},j.memoize=function(n,t){var r={};return t||(t=j.identity),function(){var e=t.apply(this,arguments);return j.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},j.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},j.defer=function(n){return j.delay.apply(j,[n,1].concat(o.call(arguments,1)))},j.throttle=function(n,t,r){var e,u,i,a=null,o=0;r||(r={});var c=function(){o=r.leading===!1?0:j.now(),a=null,i=n.apply(e,u),e=u=null};return function(){var l=j.now();o||r.leading!==!1||(o=l);var f=t-(l-o);return e=this,u=arguments,0>=f?(clearTimeout(a),a=null,o=l,i=n.apply(e,u),e=u=null):a||r.trailing===!1||(a=setTimeout(c,f)),i}},j.debounce=function(n,t,r){var e,u,i,a,o,c=function(){var l=j.now()-a;t>l?e=setTimeout(c,t-l):(e=null,r||(o=n.apply(i,u),i=u=null))};return function(){i=this,u=arguments,a=j.now();var l=r&&!e;return e||(e=setTimeout(c,t)),l&&(o=n.apply(i,u),i=u=null),o}},j.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},j.wrap=function(n,t){return j.partial(t,n)},j.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},j.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},j.keys=function(n){if(!j.isObject(n))return[];if(w)return w(n);var t=[];for(var r in n)j.has(n,r)&&t.push(r);return t},j.values=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},j.pairs=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},j.invert=function(n){for(var t={},r=j.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},j.functions=j.methods=function(n){var t=[];for(var r in n)j.isFunction(n[r])&&t.push(r);return t.sort()},j.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},j.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},j.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)j.contains(r,u)||(t[u]=n[u]);return t},j.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]===void 0&&(n[r]=t[r])}),n},j.clone=function(n){return j.isObject(n)?j.isArray(n)?n.slice():j.extend({},n):n},j.tap=function(n,t){return t(n),n};var S=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof j&&(n=n._wrapped),t instanceof j&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case"[object String]":return n==String(t);case"[object Number]":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case"[object Date]":case"[object Boolean]":return+n==+t;case"[object RegExp]":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;var a=n.constructor,o=t.constructor;if(a!==o&&!(j.isFunction(a)&&a instanceof a&&j.isFunction(o)&&o instanceof o)&&"constructor"in n&&"constructor"in t)return!1;r.push(n),e.push(t);var c=0,f=!0;if("[object Array]"==u){if(c=n.length,f=c==t.length)for(;c--&&(f=S(n[c],t[c],r,e)););}else{for(var s in n)if(j.has(n,s)&&(c++,!(f=j.has(t,s)&&S(n[s],t[s],r,e))))break;if(f){for(s in t)if(j.has(t,s)&&!c--)break;f=!c}}return r.pop(),e.pop(),f};j.isEqual=function(n,t){return S(n,t,[],[])},j.isEmpty=function(n){if(null==n)return!0;if(j.isArray(n)||j.isString(n))return 0===n.length;for(var t in n)if(j.has(n,t))return!1;return!0},j.isElement=function(n){return!(!n||1!==n.nodeType)},j.isArray=x||function(n){return"[object Array]"==l.call(n)},j.isObject=function(n){return n===Object(n)},A(["Arguments","Function","String","Number","Date","RegExp"],function(n){j["is"+n]=function(t){return l.call(t)=="[object "+n+"]"}}),j.isArguments(arguments)||(j.isArguments=function(n){return!(!n||!j.has(n,"callee"))}),"function"!=typeof/./&&(j.isFunction=function(n){return"function"==typeof n}),j.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},j.isNaN=function(n){return j.isNumber(n)&&n!=+n},j.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"==l.call(n)},j.isNull=function(n){return null===n},j.isUndefined=function(n){return n===void 0},j.has=function(n,t){return f.call(n,t)},j.noConflict=function(){return n._=t,this},j.identity=function(n){return n},j.constant=function(n){return function(){return n}},j.property=function(n){return function(t){return t[n]}},j.matches=function(n){return function(t){if(t===n)return!0;for(var r in n)if(n[r]!==t[r])return!1;return!0}},j.times=function(n,t,r){for(var e=Array(Math.max(0,n)),u=0;n>u;u++)e[u]=t.call(r,u);return e},j.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},j.now=Date.now||function(){return(new Date).getTime()};var T={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;"}};T.unescape=j.invert(T.escape);var I={escape:new RegExp("["+j.keys(T.escape).join("")+"]","g"),unescape:new RegExp("("+j.keys(T.unescape).join("|")+")","g")};j.each(["escape","unescape"],function(n){j[n]=function(t){return null==t?"":(""+t).replace(I[n],function(t){return T[n][t]})}}),j.result=function(n,t){if(null==n)return void 0;var r=n[t];return j.isFunction(r)?r.call(n):r},j.mixin=function(n){A(j.functions(n),function(t){var r=j[t]=n[t];j.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),z.call(this,r.apply(j,n))}})};var N=0;j.uniqueId=function(n){var t=++N+"";return n?n+t:t},j.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var q=/(.)^/,B={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},D=/\\|'|\r|\n|\t|\u2028|\u2029/g;j.template=function(n,t,r){var e;r=j.defaults({},r,j.templateSettings);var u=new RegExp([(r.escape||q).source,(r.interpolate||q).source,(r.evaluate||q).source].join("|")+"|$","g"),i=0,a="__p+='";n.replace(u,function(t,r,e,u,o){return a+=n.slice(i,o).replace(D,function(n){return"\\"+B[n]}),r&&(a+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'"),e&&(a+="'+\n((__t=("+e+"))==null?'':__t)+\n'"),u&&(a+="';\n"+u+"\n__p+='"),i=o+t.length,t}),a+="';\n",r.variable||(a="with(obj||{}){\n"+a+"}\n"),a="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+a+"return __p;\n";try{e=new Function(r.variable||"obj","_",a)}catch(o){throw o.source=a,o}if(t)return e(t,j);var c=function(n){return e.call(this,n,j)};return c.source="function("+(r.variable||"obj")+"){\n"+a+"}",c},j.chain=function(n){return j(n).chain()};var z=function(n){return this._chain?j(n).chain():n};j.mixin(j),A(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=e[n];j.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!=n&&"splice"!=n||0!==r.length||delete r[0],z.call(this,r)}}),A(["concat","join","slice"],function(n){var t=e[n];j.prototype[n]=function(){return z.call(this,t.apply(this._wrapped,arguments))}}),j.extend(j.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}}),"function"==typeof define&&define.amd&&define("underscore",[],function(){return j})}).call(this);
//# sourceMappingURL=underscore-min.map
// MODULE util
const util = (function(){
// Package: Util
// Library of useful functions.

// Copy-pasted from the util.js file by Max, but modified to not use require.js
// (since some of its downstream consumers, namely the authoring tool, aren't anymore.)
// TODO Completely remove util dependency, vendoring the handful of functions we actually use.

/*jshint smarttabs: true */
/*global define */

"use strict";

/* Function: isArray
Determines if the given object is an array.

Parameters:
obj - an object

Returns:
boolean - true if obj is an array.
*/
var isArray = function(obj) {
	return toString.call(obj) === "[object Array]";
},

isInt = function(val){
	if ((parseFloat(val) == parseInt(val)) && !isNaN(val)) {
		return true;
	} else {
		return false;
	}
},

/* Function: nl2br
Takes all newlines in a string and inserts breaklines instead.

Parameters:
str - string to convert
is_xhtml - boolean 

Returns:
string - new string with breaklines inserted.
*/
nl2br = function (str, is_xhtml) {   
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
},

/* Function: has
Determines if the given object is in an array.

Parameters:
array - an array
item - obj to search for in the array

Returns:
boolean - true if item is an array.
*/
has = function(array, item) {
	if (array === undefined) return false;
	return array.indexOf(item) > -1;
},

/* Function: randomKey
Keturns a random Key from an object.

Parameters:
object - an object

Returns:
string - a random key from the object.
*/
randomKey = function(obj) {
	return oneOf(Object.keys(obj));
},

/* Function: randomNumber
Returns a random integer from 1 to max. Return 1 if max <= 1 or not a number.

Parameters:
max - an integer, the highest number that might be returned.

Returns:
number (integer) between 1 and max.
*/
randomNumber = function (max, min) {
	if (min === undefined) {
		if (max <= 1 || typeof max !== "number") {
			return 1;
		}
		return Math.floor(Math.random() * Math.round(max)) + 1;
	}
	else {
		if (max <= 1 || typeof max !== "number" || max <= min || typeof min !== "number") {
			return 1;
		}
	    return Math.floor(Math.random() * (max - min + 1)) + min;
	}
},

_noRepeatTracker = {},

/* Function: randomNoRepeat
Like <randomNumber>, but returns a number that tries to be different from the last random number requested for this same key.

Parameters:
key - a string representing a unique key. For the same key, calls to randomNoRepeat will try to return a different number than the last call.
max - an integer, the highest number that might be returned.

Returns:
number (integer) between 1 and max.
*/
randomNoRepeat = function (key, max) {
	var num = 0,
		lastTime = _noRepeatTracker[key];

	if (typeof max !== "number") {
		throw new Error("util.randomNoRepeat(): called with max of " + max + " which is " + typeof max + " instead of number.");
	}
	if (max <= 1) {
		return 1;
	}

	if (lastTime === undefined) {
		num = randomNumber(max);
	} else {
		num = randomNumber(max - 1);
		if (num >= lastTime) {
			num += 1;
		}
	}
	_noRepeatTracker[key] = num;
	return num;
},

/* Function: randomJitter
When given a number and a jitter value, returns the number modified a little (to the maximum of number * jitter and minimum of number / jitter). Values closer to number are more likely than those on the edges.

Parameters:
number - an integer
jitter - a float >= 1 (1 = no jitter)

Returns
a float value based on number
*/
randomJitter = function(number, jitter) {
	if (jitter <= 1) {
		return number;
	}
	var lowest = number / jitter;
	var highest = number * jitter;
	var range = highest - lowest;
	var total = (Math.random() * (range / 3)) + (Math.random() * (range / 3)) + (Math.random() * (range / 3));
	return total + lowest;
},

_iterators = {},

/* Function: iterator
Given a key, returns a number that starts at 1 and increases by 1 each time the function is called for the same key.

Parameters:
key - a string

Returns:
number (integer)
*/
iterator = function (key) {
	if (_iterators[key] === undefined) {
		_iterators[key] = 0;
	}
	_iterators[key] += 1;
	return _iterators[key];
},

/* Function: resetIterator
Resets the iterator for a given key, so the next time <iterator> is called with that key it will return 1 again.

Parameters:
key - a string
*/
resetIterator = function (key) {
	_iterators[key] = 0;
},

/* Function: oneOf
Returns a random entry from an array, or undefined if the array is empty or not an array.

Parameters:
arr - an array of anything

Returns:
an entry from a random position in arr.
*/
oneOf = function (arr) {
	return arr[randomNumber(arr.length) - 1];
},

/* Function: oneOfNoRepeat
Like <oneOf>, except attempts to return a different entry each time the function is called with the same key.

Parameters:
key - a string
arr - an array of anything

Returns:
an entry from a random position in arr.
*/
oneOfNoRepeat = function (key, arr) {
	if (!isArray(arr) || arr.length === 0) {
		return undefined;
	}
	if (arr.length === 1) {
		return arr[0];
	}
	return arr[randomNoRepeat(key, arr.length) - 1];
},

/* Function: listWriter
Takes an array of strings and returns a single string representing it as an English list. ["one", "two", "three"] becomes "one, two, and three".

Parameters:
stringList - an array of strings.
separator - (optional) string, the word to use as the final conjunction. Defaults to "and" if not specified.
wrapper - (optional) string, will be wrapped around each parameter (usually a quote mark)

Returns:
a string
*/
listWriter = function listWriter(_stringList, _separator, _wrapper) {
	var separator = _separator || "and";
	var wrapper = _wrapper || "";
	var output = "";
	var stringList = clone(_stringList);	// because arrays are pass by reference
	var origLength = stringList.length;
	while (stringList.length > 0) {
		var item = stringList.shift();
		output += wrapper + item + wrapper;
		if (stringList.length == 1) {
			if (origLength == 2) {
				output += " " + separator + " ";
			} else {
				output += ", " + separator + " ";
			}
		} else if (stringList.length !== 0) {
			output += ", ";
		}
	}
	return output;
},

/* Function: randomOrder
Sorts an array in random order and returns it.

Parameters:
arr - the array to be sorted.

Returns:
arr sorted in a random order.
*/
randomOrder = function (arr) {
	var workArr = [],	// get fresh copy of arr
		sortedArr = [],
		randomIndex = -1;
	if (!isArray(arr)) {
		throw new Error("util.randomOrder: Called randomOrder on " + arr + " which is not an array.");
	}
	if (arr.length <= 1) {
		return arr;
	}
	workArr = arr.slice(0);
	while (workArr.length > 0) {
		randomIndex = randomNumber(workArr.length) - 1;
		sortedArr.push(workArr[randomIndex]);
		workArr.splice(randomIndex, 1);
	}
	return sortedArr;
},

/* Function: safeAdd
Adds two numbers, but never exceeds a given maximum or drops below an optional minimum.

Parameters:
num - the first number
val - the number to add to num
max - an upper limit for the largest value num can be.
min - (optional) a lower limit for the smallest value num can be.

Returns:
a number - The new value of num.
*/
safeAdd = function (num, val, max, min) {
	if (typeof num !== "number" || typeof val !== "number" ||
			(max !== undefined && typeof max !== "number") ||
			(min !== undefined && typeof min !== "number")) {
		throw new Error("util.safeAdd: called with non-numeric value (parameters were " + num + ", " + val + ", " + max + ")");
	}
	num = num + val;
	if (num > max) {
		num = max;
	}
	if (min !== undefined && num < min) {
		num = min;
	}
	return num;
},

safeOp = function (num, val, op, min, max) {
	if (typeof num !== "number" || typeof val !== "number" ||
			(typeof max !== "number" && max !== undefined) ||
			typeof min !== "number" && min !== undefined) {
		throw new Error("util.safeOp: called with non-numeric value (parameters were num:" + num + ", val:" + val + ", min:" + min + ", max:" + max + ")");
	}
	switch(op) {
		case "+": num = num + val; break;
		case "*": num = num * val; break;
		case "-": num = num - val; break;
		case "/":
			if (val === 0) {
				num = num;
				console.log("util.safeOp: divide by 0, returning num instead. (num=" + num + ", val=" + val + ", op=" + op + ", min=" + min + ", max=" + max);
			} else {
				num = num / val;
			}
			break;
	}
	if (max !== undefined && num > max) {
		num = max;
	}
	if (num < min) {
		num = min;
	}
	return num;
},

safeMultiply = function (num, val, max) {
	return safeOp(num, val, "*", 0, max)
},
safeAdd = function (num, val, max) {
	return safeOp(num, val, "+", 0, max)
},
safeSubtract = function (num, val, min) {
	return safeOp(num, val, "-", min, undefined)
},
safeDivide = function (num, val, min) {
	return safeOp(num, val, "/", min, undefined)
},

/* Function: iCap
Takes a string and ensures the first letter is capitalized. Assumes the string begins with a letter, not a space or non-alpha.

Parameters:
str - the string in question

Returns:
str with the first letter capitalized

Note:
You can also say iUpper for parity with <iLower>.
*/
iCap = function (str) {
	if (typeof str !== "string") {
		throw new Error("util.iCap(): called iCap on " + str + " which is not a string.");
	}
	return str.charAt(0).toUpperCase() + str.slice(1);
},

/* Function: iLower
Takes a string and ensures the first letter is lower case. Assumes the string begins with a letter, not a space or non-alpha.

Parameters:
str - the string in question

Returns:
str with the first letter in lower case
*/
iLower = function (str) {
	if (typeof str !== "string") {
		throw new Error("util.iLower: called iLower on " + str + " which is not a string.");
	}
	return str.charAt(0).toLowerCase() + str.slice(1);
},

/* Function: titleCase
Takes a string and ensures the first letter of each word is capitalized.

Parameters:
str - the string in question

Returns:
str with the first letter of each word capitalized
*/
titleCase = function (str) {
	var strList = [],
		finalStr = "",
		sPos = 0;
	if (typeof str !== "string") {
		throw new Error("util.titleCase(): called titleCase on " + str + " which is not a string.");
	}
	strList = str.trim().split(" ");
	for (sPos in strList) {
		finalStr += iCap(strList[sPos]) + " ";
	}
	return finalStr.trim();
},

/* Function: isOneOf
Takes a string and an array of strings and returns true if the first string appears in the array, case insensitively.

Parameters:
base - the string to check
options - an array of strings to check against. If base appears in options we return true.

Returns:
boolean - true if base is in options.
*/
isOneOf = function (base, options) {
	var b = "",
		option = "";
	if (typeof base !== "string" || !isArray(options) || typeof options[0] !== "string") {
		throw new Error("util.isOneOf:Called isOneOf with wrong type of inputs (should be string, array of strings; instead was " + base + " (" + typeof base + "), " + options + " (" + typeof options + ")");
	}
	b = base.toLowerCase();
	for (option in options) {
		if (b === options[option].toLowerCase()) {
			return true;
		}
	}
	return false;
},

/* Function: listify
Take an object and produce a comma-separated list of its keys.

Parameters:
obj - the object in question

Returns:
string - the list of keys.
*/
listify = function (obj) {
	var str = "",
		ctr = 0,
		key = "";
	for (key in obj) {
		if (ctr === 0) {
			str += key;
		} else {
			str += ", " + key;
		}
		ctr += 1;
	}
	return str;
},

/* Function: haveSameContents
Returns true if the two given arrays contain the same elements, order aside.

Parameters:
arr1 - the first array
arr2 - the second

Returns:
boolean - true if the two arrays contain the same contents, order aside; false otherwise.
*/
haveSameContents = function (arr1, arr2) {
	var i = 0,
		checklist = [];
	if (!isArray(arr1) || !isArray(arr2)) {
		throw new Error("util.haveSameContents(): called with a non-array parameter.");
	}
	if (arr1.length !== arr2.length) {
		return false;
	}
	checklist = arr2.slice(0); // create a deep copy
	for (i in arr1) {
		var matchPos = checklist.indexOf(arr1[i]);
		if (matchPos >= 0) {
			checklist.splice(matchPos, 1);
		} else {
			return false;
		}
	}
	if (checklist.length === 0) {
		return true;
	}
	return false;
},

/* Function: degToRad
Takes a number in degrees and returns in radians.

Parameters:
num - a number in degrees

Returns:
a number in radians
*/
degToRad = function (num) {
	return num * (Math.PI / 180);
},

/* Function: radToDeg
Takes a number in radians and returns in degrees.

Parameters:
num - a number in radians

Returns:
a number in degrees
*/
radToDeg = function (num) {
	return num * (180 / Math.PI);
},

/* Function: roundTo
Round to nearest given decimal. roundNumber(2.432, 1) equals 2.4

Parameters:
num - the number to round
dec - an integer, the number of significant digits after the decimal to round to.

Returns:
a number

Note:
If you're doing this to display as a string, Javascript has the built-in function num.toFixed(precision)
*/
roundTo = function (num, dec) {
	var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
	return result;
},

/* Function: remap
Returns a val in the given old range converted to its position in the given new range, as a float.

Example:
remap(10, 1, 10, 1, 100) = 100 (read: If you take 10 on a scale of 1 to 10, and ask what its equivalent is on a scale of 1 to 100, the answer is 100.)

Parameters:
val - the number to remap
oldRangeL - the bottom end of the old range
oldRangeU - the upper end of the old range
newRangeL - the bottom end of the new range
newRangeU - the upper end of the new range

Returns:
a number, val remapped to the new range.
*/
remap = function (val, oldRangeL, oldRangeU, newRangeL, newRangeU) {
	return (((val - oldRangeL) / (oldRangeU - oldRangeL)) * (newRangeU - newRangeL)) + newRangeL;
},

// Returns a number as a spelled-out equivalent, like 20 --> twenty, for any number up to 9999. Four-digit numbers are printed like years (nineteen fifty-six). Return a string unchanged.
printedNumber = function (num) {
	if (typeof num === "string") return num;
	var s = "";
	if (num < 20) {
		switch(num) {
			case 0: s = "zero"; break;
			case 1: s =  "one"; break;
			case 2: s =  "two"; break;
			case 3: s =  "three"; break;
			case 4: s =  "four"; break;
			case 5: s =  "five"; break;
			case 6: s =  "six"; break;
			case 7: s =  "seven"; break;
			case 8: s =  "eight"; break;
			case 9: s =  "nine"; break;
			case 10: s =  "ten"; break;
			case 11: s =  "eleven"; break;
			case 12: s =  "twelve"; break;
			case 13: s =  "thirteen"; break;
			case 14: s =  "fourteen"; break;
			case 15: s =  "fifteen"; break;
			case 16: s =  "sixteen"; break;
			case 17: s =  "seventeen"; break;
			case 18: s =  "eighteen"; break;
			case 19: s =  "nineteen"; break;
			default: s = "less than zero"; break;
		}
	} else if (num < 100) {
		switch (Math.floor(num/10)) {
			case 2: s = "twenty"; break;
			case 3: s = "thirty"; break;
			case 4: s = "forty"; break;
			case 5: s = "fifty"; break;
			case 6: s = "sixty"; break;
			case 7: s = "seventy"; break;
			case 8: s = "eighty"; break;
			case 9: s = "ninety"; break;
		}
		if (num % 10 != 0) {
			s = s + "-" + printedNumber(num % 10);
		}
	} else if (num < 200) {
		s = "a hundred";
		if (num - 100 > 0) s = s + " and " + printedNumber(num - 100);
	} else if (num < 1000) {
		s = printedNumber(Math.floor(num/100)) + " hundred";
		if (num % 100 != 0) s = s + " and " + printedNumber(num % 100);
	} else if (num < 9999) {
		s = printedNumber(Math.floor(num/100));
		if (num % 100 != 0) {
			s = s + " " + printedNumber(num % 100);
		} else {
			s = s + " hundred";
		}
	} else {
		s = "at least ten thousand";
	}
	return s;
},

ordinalNumber = function(num) {
	if (typeof num === "string") return num;
	var s = printedNumber(num) + "th";
	switch(num) {
		case 0: s = "zeroth"; break;
		case 1: s =  "first"; break;
		case 2: s =  "second"; break;
		case 3: s =  "third"; break;
		case 5: s =  "fifth"; break;
		case 8: s =  "eighth"; break;
		case 9: s =  "ninth"; break;
		case 12: s =  "twelfth"; break;
		case 20: s = "twentieth"; break;
	}
	if (num > 20) {
		var numAsStr = ""+num;
		var lastDigit = numAsStr[numAsStr.length-1];
		switch(lastDigit) {
			case "1": s = num + "st"; break
			case "2": s = num + "nd"; break;
			case "3": s = num + "rd"; break;
			default: s = num + "th"; break;
		}
	}
	return s;
},

/* Function: clone
Creates a clone (non-reference version) of an array or object. Code courtesy A. Levy on Stackoverflow.

Parameters:
obj - the object to clone

Returns:
a new object identical to obj
*/
clone = function (obj) {
    // Handle the 3 simple types, and null or undefined
    if (null === obj || "object" !== typeof obj) return obj;

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
},

assert = function (condition, messageIfFalse) {
	if (condition) {
		console.log("Passed");
	} else {
		console.log("FAILED: " + messageIfFalse);
		for (var i = 2; i <= arguments.length; i++) {
			console.log(arguments[i]);
		}
	}
},

objToText = function(obj, indentLevel) {
	if (indentLevel === undefined) {
		indentLevel = 0;
	}
	var str = "";
	var spaces = Array(indentLevel + 1).join(" ");
	for (var key in obj) {
		if (typeof obj[key] === "object") {
			str += spaces + key + ": " + "\n"
			str += objToText(obj[key], indentLevel+2);
		} else {
			str += spaces + key + ": " + obj[key] + "\n";
		}
	}
	return str;
};

// Adds support for trim if using a browser that doesn't provide it.
if(!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/g,'');
	};
}




// revealing public API
// Note: The reason we do it this way is to let us declare private variables next to the functions they relate to, rather than having to put them all at the top before the "return" block exposing the functions.
return {
	randomKey: randomKey,
	isArray: isArray,
	isInt: isInt,
	has: has,
	randomNumber: randomNumber,
	randomNoRepeat: randomNoRepeat,
	randomJitter: randomJitter,
	iterator: iterator,
	resetIterator: resetIterator,
	oneOf: oneOf,
	oneOfNoRepeat: oneOfNoRepeat,
	randomOrder: randomOrder,
	safeAdd: safeAdd,
	safeMultiply: safeMultiply,
	safeSubtract: safeSubtract,
	safeDivide: safeDivide,
	// strip: strip,		// Same as built-in trim.
	iCap: iCap,
	iUpper: iCap,			// Alias
	iLower: iLower,
	titleCase: titleCase,
	isOneOf: isOneOf,
	listify: listify,
	haveSameContents: haveSameContents,
	degToRad: degToRad,
	radToDeg: radToDeg,
	roundTo: roundTo,
	remap: remap,
	listWriter: listWriter,
	clone: clone,
	printedNumber: printedNumber,
	ordinalNumber: ordinalNumber,
	nl2br: nl2br,

	objToText: objToText,

	assert: assert
};

})();
// MODULE socialRecord
const socialRecord = (function(){
/**
* This is the class socialRecord
* @class  socialRecord
* @private
*/
var socialRecord = [];
var currentTimeStep = -1; //initialize to -1 (assumes we start at time 0 when playings)
var defaultValues = {};
var maxValues = {};
var minValues = {};
var directions = {};
var isBooleans = {};
var clonePolicies = {};
var durations = {};
var offstageCharacters = []; // Characters that aren't in the current level (think Prom Week)
var eliminatedCharacters = []; // Characters that are never coming back and have had references to/from removed (think Dayton)

/**
 * @method getLength
 * @memberof socialRecord
 * @description gets the length of the socialRecord object.
 * @private
 * @return {[int]} [length of the socialRecord object]
 */
var getLength = function () {
	return socialRecord.length;
};

/**
 * @function getLengthAtTimeStep 
 * @description Given a timestep, returns the length of the array at the index represented by that timestep in the socialRecord.
 * @param  {[int]} timestep [The timestep to get the length of. Should be >= 0]
 * @return {[int]}          [the length of the array that resides at socialRecord[timestep]]
 * @private
 */
var getLengthAtTimeStep = function(timestep){
	if(timestep < 0){
		console.log("ERROR in getLengthAtTimeStep -- tried to get the length of a negative timestep");
	}
	else{
		return socialRecord[timestep].length;
	}
};

/**
 * @method getCurrentTimeStep
 * @memberOf ensemble
 * @public
 * @description return the value of currentTimeStep.
 * @example console.log("The currentTimestep is : " , ensemble.getCurrentTimestep());
 * @return {Int} the currentTimeStep stored in the socialRecord
 */
var getCurrentTimeStep = function(){
	return currentTimeStep;
};

/**
 * @method  dumpSocialRecord
 * @description A debugging function. Dumps the whole socialRecord object to the console, to enable reviewing of both the current state of the simulation, and its history.
 * @public
 @example ensemble.dumpSocialRecord();
 * @memberOf ensemble
 */
var dumpSocialRecord = function() {
	console.log("socialRecord:", socialRecord);
};


/**
 * @method getSocialRecordCopyAtTimestep
 * @memberOf ensemble
 * @public

 * @description Returns a copy of the socialRecord at the given timestep.
 *
 * @param  {Number} timeStep The timestep to retrieve. If undefined, assume the current timestep.
 * @example var historyAtTimestepTwo = ensemble.getSocialRecordCopyAtTimestep(2);
 * @return {Object} A copy of an socialRecord timeslice, an array of predicate objects.
 *
 * 
 */
var getSocialRecordCopyAtTimestep = function(timeStep) {
	if (timeStep === undefined) {
		timeStep = currentTimeStep;
	}
	var slice = util.clone(socialRecord[timeStep]);
	if (slice === undefined) {
		slice = [];
	}
	return slice;
}

var getSocialRecordCopy = function() {
	return util.clone(socialRecord);
}

var registerMaxValue = function (predicate) {
	maxValues[predicate.category] = predicate.maxValue !== undefined ? predicate.maxValue : 100;
};

var getRegisteredMaxValue = function (predicate) {
	if (predicate === undefined || predicate.category === undefined) {
		console.log("Error: this predicate had no category.", predicate);
	}
	return maxValues[predicate.category];
};	

var registerMinValue = function (predicate) {
	minValues[predicate.category] = predicate.minValue !== undefined ? predicate.minValue : 0;
};

var getRegisteredMinValue = function (predicate) {
	return minValues[predicate.category];
};

var registerDuration = function (predicate) {
	durations[predicate.category] = predicate.duration;
};

var getRegisteredDuration = function (predicate) {
	return durations[predicate.category];
};

var registerDirection = function (predicate) {
	directions[predicate.category] = predicate.directionType;
};

/**
 * @method getRegisteredDirection
 * @public
 * @memberOf ensemble
 * @description Given a predicate with a category specified, checks to see what "direction" is associated with the category (undirected, directed, or reciprocal)
 * @param {Object} predicate An ensemble predicate that, at the very least, has a category defined.
 * @example var directionType = ensemble.getRegisteredDirection(myPredicate);
 * @return {String} Returns a success message upon initialization.
 *
 */
var getRegisteredDirection = function (predicate) {
	return directions[predicate.category];
};

var registerDefaultValue = function (predicate) {
	defaultValues[predicate.category] = predicate.defaultValue;
};

var getRegisteredDefaultValue = function (predicate) {
	return defaultValues[predicate.category];
};

var registerIsBoolean = function(predicate){
	isBooleans[predicate.category] = predicate.isBoolean;
};

var getRegisteredIsBoolean = function(predicate){
	return isBooleans[predicate.category];
};

/**
* @description  Catches the socialRecord's currentTimeStep up to the timeStep specified.
*
* @method setUpNextTimeStep
* @memberof ensemble
* @return {int} The current timestep. 
* @example ensemble.setupNextTimeStep(10); // sets the current timestep of the social history to 10.
* @example ensemble.setupNextTimeStep(); // increments the current timestep by one.
* @param {Number} timeStep The timeStep to catch up the socialRecord to. If omitted, assumes the currentTimeStep + 1.
*/
var setupNextTimeStep = function (timeStep) {
	if (currentTimeStep === -1) {
		currentTimeStep += 1;
	}
	
	if (timeStep === undefined) {
		timeStep = currentTimeStep + 1;
	}
	var currentSocialRecordEntry = currentTimeStep;

	// If this given timestep in the socialRecord doesn't exist yet, fill it in with an empty array.
	if(socialRecord[currentTimeStep] === undefined ){
		socialRecord[currentTimeStep] = [];
	}

	for (var i = currentTimeStep + 1; i <= timeStep ; i += 1) {

		//socialRecord[i] = util.clone(socialRecord[i-1]); OLD WAY, changed to no longer clone things we aren't supposed to in the first place.
		socialRecord[i] = [];
		if(socialRecord[i-1] !== undefined){
			for(var k = 0; k < socialRecord[i-1].length; k += 1){
				if(getRegisteredDuration(socialRecord[i-1][k]) !== 0 ){
					//ONLY clone if the duration is 0.
					//Otherwise we are dealing with something like an socialRecord label, and we don't want to copy it
					//to this new timestep.
					var newRec = util.clone(socialRecord[i-1][k]);
					socialRecord[i].push(newRec);
				}
			}
		}


		// code to handle the expiring of statuses
		// if at a given timeStep, an element in the socialRecord has a duration timer,
		// decrement it, and if necessary reverse the status value and delete the duration timer
		for (var j = 0 ; j < socialRecord[i].length; j++ ){
			if (getRegisteredIsBoolean(socialRecord[i][j])) {
				if (socialRecord[i][j].duration !== undefined) {
					socialRecord[i][j].duration -= 1;
					if (socialRecord[i][j].duration <= 0) {
						delete socialRecord[i][j].duration;
						// We set it to false; if we just delete it, the old true value gets cloned over.
						if (socialRecord[i][j].value !== false) {
							socialRecord[i][j].value = false;
							socialRecord[i][j].timeHappened = timeStep;
						}
					}
				}
			}
		}
	}

	//Only update the timeStep if the value passed in is greater than the current time step
	//i.e. don't allow this function to 'rewind' time and go back to an earlier timestep.'
	if(timeStep > currentTimeStep){
		currentTimeStep = timeStep;
	}
	// Rewind the socialRecord, clearing out what was in it after the point we are rewinding to
	else if (timeStep < currentTimeStep) {
		for (var i = currentTimeStep; i > timeStep ; i -= 1) {
			socialRecord[i] = [];
		}
		currentTimeStep = timeStep;
	}
	return currentTimeStep;
};

// Helper function for newGet(). Checks whether two predicates have a compatible value, taking into account an optional operator and passed-in expected values.
var checkValueMatch = function(socialRecordValue, searchValue, operator) {
	if (searchValue === "any") {
		return true;
	}
	if (typeof searchValue === "boolean" && socialRecordValue !== searchValue) {
		return false;
	}
	else if (operator === "=" && socialRecordValue !== searchValue) {
		return false;
	}
	else if (operator === ">" && socialRecordValue <= searchValue) {
		return false;
	}
	else if (operator === "<" && socialRecordValue >= searchValue) {
		return false;
	}
	// Either the values match, or we have a numeric category but no operator, in which case we count this as a match (we're probably trying to get the current value of this predicate.)
	return true;
}

var matchedResults;
var matchedResultsStrings;

// Helper function for newGet(). Adds a matching predicate to the module array matchedResults, either as a new object or a reference to a point in the socialRecord, and ensuring no duplicate predicates are added.
var addResult = function(predicateRef, value, addAsReference) {

	var matchResult;

	if (addAsReference) {
		// Simply add the reference to this predicate in the socialRecord.
		matchResult = predicateRef;
	} else {
		// We're matching a predicate that doesn't exist in the socialRecord because it's representing a default value.
		matchResult = util.clone(predicateRef);
		if (value !== undefined) {
			matchResult.value = value;
		}
	}

	// Add the predicate to the list, if it hasn't been seen before.
	var hash = predicateHash(matchResult);
	if (! matchedResultsStrings[hash]) {
		matchedResults.push(matchResult);
	}
	matchedResultsStrings[hash] = true;

}

// Helper function used by socialRecord.get to see if the given predicate matches a default value.
var checkForDefaultMatch = function(searchPredicate, defaultValue, searchValue, isBooleanPred) {
	var matchesDefault;
	if (searchPredicate.value !== undefined) {

		matchesDefault = checkValueMatch(defaultValue, searchValue, searchPredicate.operator || "="); // assume a check for equality if no operator
		if (matchesDefault) {
			addResult(searchPredicate, defaultValue, false);
		}
	}

	// If the search predicate is numeric and did not provide a value, we want to add an entry to the socialRecord with the default value, and return a reference to that.
	else if (searchPredicate.value === undefined && !isBooleanPred && defaultValue !== undefined)  {
		var tempPred = util.clone(searchPredicate);
		tempPred.value = defaultValue;
		socialRecord[currentTimeStep].push(tempPred);
		addResult(tempPred, defaultValue, true);
	}

	// If the search predicate is boolean and did not provide a value... we want to do... something?
	else if (searchPredicate.value === undefined && isBooleanPred && defaultValue !== undefined) {
		matchesDefault = checkValueMatch(defaultValue, searchValue, searchPredicate.operator || "="); // assume a check for equality if no operator
		if (matchesDefault) {
			var tempBoolPred = util.clone(searchPredicate);
			addResult(tempBoolPred, defaultValue, false);
		}
	}
};

//ensemble.get() should be called by public, this should only be used internally.
var get = function(searchPredicate, mostRecentTime, lessRecentTime, useDefaultValue, params) {

	var searchValue = searchPredicate.value;
	var defaultValue = defaultValues[searchPredicate.category];
	var isBooleanPred = getRegisteredIsBoolean(searchPredicate);
	var foundPatternMatch = false;	// Track whether we ever find a pattern matching the search predicate across this search.
	useDefaultValue = typeof useDefaultValue !== 'undefined' ? useDefaultValue : true;

	// if (searchPredicate.value !== undefined && searchPredicate.operator === undefined && isBooleanPred === false) {
	// 	console.log("searchPredicate", searchPredicate);
	// 	throw new Error("Must define operator with value!");
	// }


	matchedResults = [];		//predicate results to return
	matchedResultsStrings = {};	//dictionary of predicates already stored.

	
	if (searchValue === undefined && useDefaultValue) {
		if (isBooleanPred) {
			// If the client fails to specify a boolean value, we assume we are searching for the opposite of the default state. For instance, if the default value of a flag is false, and we omit a value in get(), the implication is that we're searching for a non-default case (true).
			searchValue = true;
		}
	}
	

	//In the case where we have a numeric predicate with a value, but no operator specified,
	//assume that the operator is '='
	if(!isBooleanPred){
		if(searchValue !== undefined && searchPredicate.operator === undefined){
			searchPredicate.operator = "=";
		}
	}

	// Convert relative to absolute time steps.
	// doing a special check to verify that we aren't 'pretending' that the
	//end of the sfdb is maybe a little earier than it would be otherwise.
	var currentTimeStepToUse = currentTimeStep;
	if(params !== undefined && params.timeStep !== undefined){
		currentTimeStepToUse = params.timeStep; // pretend that the 'current time step' (i.e. the end of the sfdb) was the value that was passed in.
	}
	mostRecentTime = currentTimeStepToUse - mostRecentTime;
	lessRecentTime = currentTimeStepToUse - lessRecentTime;

	var foundAnySocialRecordTimesteps = false;

	// Look through each defined socialRecord time step in the given range.
	for (var i = lessRecentTime ; i <= mostRecentTime ; i += 1) {
		if(socialRecord[i] !== undefined) {

			foundAnySocialRecordTimesteps = true;
			// Consider each predicate at this socialRecord timestep.
			for (var j = 0 ; j < socialRecord[i].length ; j += 1) {
				var socialRecordPredicate = socialRecord[i][j];

				// Skip any predicates that don't match the search predicate's specification. 
				if (socialRecordPredicate.isActive === false) {
					continue;
				}
				if (searchPredicate.category !== undefined && searchPredicate.category !== socialRecordPredicate.category) {
					continue;
				}
				if (searchPredicate.type !== undefined && searchPredicate.type !== socialRecordPredicate.type) {
					continue;
				}
				if (searchPredicate.first !== undefined && searchPredicate.first !== socialRecordPredicate.first) {
					continue;
				}
				if (searchPredicate.second !== undefined && searchPredicate.second !== socialRecordPredicate.second) {
					continue;
				}

				// If we made it to here, we found a match of the search predicate's pattern (although the value may not match up.)
				foundPatternMatch = true;

				// We don't want to assume "=" as operator, b/c then we won't match checks for existing socialRecord values.
				var doesValueMatch = checkValueMatch(socialRecordPredicate.value, searchValue, searchPredicate.operator);

				if (doesValueMatch) {
					addResult(socialRecordPredicate, searchValue, true);
				}
			}

			// In the case that we found no pattern matches for this predicate (meaning the socialRecord has no record of this information), see if the default value should indicate a positive result anyway.
			if ( !foundPatternMatch ) {
				checkForDefaultMatch(searchPredicate, defaultValue, searchValue, isBooleanPred);
			}
			foundPatternMatch = false;

		} // end if(socialRecord[i] !== undefined)

	} // end for (var i = lessRecentTime

	// In the case where the whole socialRecord was empty, we never got a chance to check for default values, so do it here.
	if (!foundAnySocialRecordTimesteps) {
		checkForDefaultMatch(searchPredicate, defaultValue, searchValue, isBooleanPred);
	}

	return matchedResults;
};

/**
 * @method addHistory 
 * @description  Load backstory/starting history into Ensemble. This function takes a history definition object (such as that which is returned from a call to loadFile) and uses it to initializing the starting state of the social record.
 * @public
 * @memberOf ensemble
 @example var rawHistory = ensemble.loadFile("data/history.json");
var history = ensemble.addHistory(rawHistory);
 * @return {object} A Parsed JSON file representing the history that was just loaded in.
 * @param  {object} content - A javascript object detailing the social history to populate the socialRecord with.
 */
var addHistory = function(content) {
	var history;
	try {
		if (typeof content === "string") {
			history = (JSON.parse(content)).history;
		} else if (typeof content === "object") {
			history = content.history;
		} else {
			console.log("unexpected value:", content);
			throw new Error("Error load social structure: unexpected data value: ", typeof content);
		}
	} catch (e) {
		throw new Error("JSON Error load social structure (history): " + e);
	}
	
	var lastPos = -9999999999;
	for (var i = 0; i < history.length; i++) {
		// TODO add more error checking to look for out-of-order history steps, etc.
		var historyAtTime = history[i];
		if (historyAtTime.pos <= lastPos) {
			console.log("Tried to load a history file but timeStep " + historyAtTime.pos + " came after timeStep " + lastPos + "; history files must declare timesteps sequentially.");
			return;
		}
		lastPos = historyAtTime.pos;
		setupNextTimeStep(historyAtTime.pos);
		for (var j = 0; j < historyAtTime.data.length; j++) {
			var pred = historyAtTime.data[j];
			pred.origin = content.source_file;
			try {
				set(pred);
			} catch(e) {
				console.log("invalid history file! double check  predicate on console");
				console.log("invalid predicate in history:", pred);
				return;
			}
		}
	}
	return content;
};


// Return a hash string guaranteed to be unique for each distinct predicate regardless of key order.
var predicateHash = function(obj) {
	var hash = [];
	var sortedKeys = _.keys(obj).sort();
	for (var i = 0; i < sortedKeys.length; i++) {
		hash[i] = obj[sortedKeys[i]];
	};
	return hash.join("");
};

/**
* A simple toString for a predicate, as the natural one just returns Object [object]
* This function is meant to be assigned to a predicate objects toString method.
*
* @method predicateToString
* @memberof socialRecord
* @return a string representation of the current predicate represented by 'this'
*/
var predicateToString = function(){
	var returnString = "";
	for (var key in this) {
		returnString += key + ": " + this[key] + ", ";
		//console.log(key + ": " + this[key]);
	}
	return returnString;
};


/**
* @description Allows a predicate to be saved to the socialRecord at the current timeStep. Handles stored predicate updating as well as storing new predicates
*
* @method set
* @memberof ensemble
* @public
* @example var predicateToSet = {"category":"trait", "type":"kind", "first":"Bob", "value":"true"};
ensemble.set(predicateToSet); // will give the character Bob the trait "kind".
* @param {Object} setPredicate - the predicate that we would like to save to the socialRecord
*/
var set = function(setPredicate) {
	var pattern = {};
	pattern.category = setPredicate.category;
	pattern.type = setPredicate.type;
	pattern.first = setPredicate.first;
	pattern.second = setPredicate.second;
	pattern.origin = setPredicate.origin;

	var value = setPredicate.value;
	var operator = setPredicate.operator;

	var isBooleanPred = getRegisteredIsBoolean(setPredicate);
	var isReciprocal = getRegisteredDirection(setPredicate) === "reciprocal";
	var defaultValue = defaultValues[pattern.category];
	var duration = getRegisteredDuration(setPredicate);
	var max = getRegisteredMaxValue(setPredicate);
	var min = getRegisteredMinValue(setPredicate);

	var timeStep = getCurrentTimeStep();
	if (timeStep === -1) {
		setupNextTimeStep(0);
		timeStep = 0;
	}

	//TODO: Changed this to just making value = true for consistency, but we should discuss this.
	// If we're trying to set a boolean value and we've left out the value, assume we mean the non-default.
	if (isBooleanPred && value === undefined) {
		//value = ! defaultValue;
		value = true;
	}

	// Get a reference to an socialRecord record.
	var socialRecordPredicate;
	var searchResult = get(pattern, 0, 0, false);
	if (searchResult.length === 0) {
		socialRecordPredicate = pattern;
		socialRecordPredicate.value = defaultValue;
		if (socialRecordPredicate.isActive === undefined && setPredicate.isActive !== undefined) {
			socialRecordPredicate.isActive = setPredicate.isActive;
		}
		socialRecordPredicate.id = util.iterator("socialRecords");
		socialRecord[timeStep].push(socialRecordPredicate);
	} else if (searchResult.length === 1) {
		socialRecordPredicate = searchResult[0];
		socialRecordPredicate.id = util.iterator("socialRecords");
	} else {
		console.log("bad predicate: ", setPredicate);
		throw new Error("Expected any pattern get to the socialRecord to return either an existing record or make a new one w/the default value and return that.")			
	}

	socialRecordPredicate.timeHappened = timeStep;
	socialRecordPredicate.duration = duration;

	if (operator === undefined || operator === "=") {
		// Straight update.
		socialRecordPredicate.value = value;
	} else {
		// Offset.
		if (operator === "+") {
			socialRecordPredicate.value += value;
		} else if (operator === "-") {
			socialRecordPredicate.value -= value;
		}
	}

	// Verify new value is valid.
	if (!isBooleanPred) {
		if (socialRecordPredicate.value > max) {
			socialRecordPredicate.value = max;
		}
		if (socialRecordPredicate.value < min) {
			socialRecordPredicate.value = min;
		}
	}

	// Also update if a reciprocal predicate.
	if (isReciprocal) {
		var recipPredicate = util.clone(setPredicate);
		var temp = recipPredicate.second;
		recipPredicate.second = recipPredicate.first;
		recipPredicate.first = temp;
		recipPredicate.value = undefined;
		recipPredicate.isActive = setPredicate.isActive;
		recipPredicate.id = util.iterator("socialRecords");

		var rPred;
		var recipSearchResult = get(recipPredicate, 0, 0, false);
		if (recipSearchResult.length === 1) {
			rPred = recipSearchResult[0]
		} else {
			rPred = recipPredicate;
			socialRecord[timeStep].push(rPred);
		}

		rPred.timeHappened = socialRecordPredicate.timeHappened;
		rPred.duration = socialRecordPredicate.duration;
		rPred.value = socialRecordPredicate.value;

	}

}

/**
 * @method setById
 * @memberOf ensemble
 * @private
 * @description A means to update a social record by ID. Primarily meant to be used by the uathoring tool
 */
var setById = function(id, newRecord) {
	if (id === undefined || id === null) {
		return false;
	}
	for (var timeStep = 0; timeStep < socialRecord.length; timeStep++) {
		for (var j = 0; j < socialRecord[timeStep].length; j++) {
			if (socialRecord[timeStep][j].id === id) {
				socialRecord[timeStep][j] = newRecord;
				return true;
			}
		}
	}
	return false;
}

/**
* @method clearHistory
* @memberOf ensemble
* @public
* @description Clears out the history of the socialRecord, and sets the current timestep back to the start. Note that all registered things from blueprints, such as
* defaultValues and directions, are NOT removed, so there is no need to re-register
* @example ensemble.clearHistory(); // all entries in the social record have now been removed, and the currentTimeStep has been reinitialized.
*/
var clearHistory = function(){
	socialRecord = [];
	currentTimeStep = -1;
};

/**
* Clears out EVERYTHING from the socialRecord. This means the entire social history, and also data that came from
* our factory blueprints, including defaultValues and directions. After calling this, predicates need to be re-registered
*
* @method clearEverthing
* @memberof socialRecord
*/
var clearEverything = function(){
	socialRecord = [];
	currentTimeStep = -1;
	defaultValues = {};
	maxValues = {};
	minValues = {};
	directions = {};
	isBooleans = {};
	clonePolicies = {};
	durations = {};
	offstageCharacters = [];
	eliminatedCharacters = [];
};

/**
 * Prints out the contents of the socialRecord's history at a given timeStep. If no timeStep is specified,
 * prints out the conents of the socialRecord at the current time step
 *
 * @method socialRecordHistoryToString
 * @memberof socialRecord
 * @param timeStep 			an integer representing the timeStep we want to see the contents of the socialRecord at. Assume current time step if undefined.
 * @return historyString 	A string representing the contents of the socialRecord at the specified point in history
 */
var socialRecordHistoryToString = function(timeStep){
	if(timeStep === undefined){
		timeStep = currentTimeStep;
	}

	var historyString = "******socialRecord At Time " + timeStep + "********\n";

	for(var i = 0; i < socialRecord[timeStep].length; i += 1){
		historyString += "<PREDICATE " + i + ">\n";
		historyString += "category: " + socialRecord[timeStep][i].category + "\n";
		historyString += "type: " + socialRecord[timeStep][i].type + "\n";
		historyString += "first: " + socialRecord[timeStep][i].first + "\n";
		historyString += "second: " + socialRecord[timeStep][i].second + "\n";
		historyString += "value: " + socialRecord[timeStep][i].value + "\n";
		historyString += "timeHappened: " + socialRecord[timeStep][i].timeHappened + "\n";
		historyString += "---------------------------\n";
	}

	historyString += "Total Length: " + socialRecord[timeStep].length + "\n";
	historyString += "******************************";
	return historyString;

};

var socialRecordFullHistoryToString = function(){
	var returnString = "";
	for(var i = 0; i < socialRecord.length; i += 1){
		returnString += socialRecordHistoryToString(i);
	}
	return returnString;
};

//setter for if a character is offstage.
var putCharacterOffstage = function(characterName){
	//TODO: Validate that 'characterName' is a valid character in this system!
	if(offstageCharacters.indexOf(characterName) === -1){
		//Awesome, let's add them to offstage!
		offstageCharacters.push(characterName);
	}
	else{
		//Character was already offstage...
		console.log("Character was already offstage, doing nothing...");
	}
};

//getting for if a character is offstage.
var getIsCharacterOffstage = function(characterName){
	if(offstageCharacters.indexOf(characterName) === -1){
		//they are not offstage
		return false;
	}
	return true;
};

//set a character to be eliminated
var eliminateCharacter = function(characterName){
	//TODO: Validate that 'characterName' is a valid character in this system.
	if(eliminatedCharacters.indexOf(characterName) === -1){
		//Alright, let's add them to the eliminated list...
		eliminatedCharacters.push(characterName);

		//if this character was also on the 'offstage' list, let's remove them from there.
		var indexInOffstage = offstageCharacters.indexOf(characterName);
		if(indexInOffstage !== -1){
			offstageCharacters.splice(indexInOffstage, 1);
		}

		//actually remove references to this character.
		removeAllSocialFactsFromCharacter(characterName);
	}
	else{
		//Character was already eliminated...
		console.log("Character was already eliminated, doing nothing...");
	}
};

//getter for if a character is eliminated.
var getIsCharacterEliminated = function(characterName){
	if(eliminatedCharacters.indexOf(characterName) === -1){
		//they are not eliminated
		return false;
	}
	return true;
};

//takes a character OFF of the offstage list.
var putCharacterOnstage = function(characterName){
	var index = offstageCharacters.indexOf(characterName);
	if(index !== -1){
		//They used to be offstage -- let's put them onstage!
		offstageCharacters.splice((index), 1);
	}
};

var removeAllSocialFactsFromCharacter = function(characterName){
	//TODO: Validate that characterName is an actual character in the system.
	removeDirectedSocialFacts(characterName);
	removeReciprocalSocialFacts(characterName);
	removeUndirectedSocialFacts(characterName);
};

var removeUndirectedSocialFacts = function(characterName){
	var indicesToRemove = [];
	for(var i = 0; i < socialRecord[currentTimeStep].length; i += 1){
		var socialFact = socialRecord[currentTimeStep][i];
		if(getRegisteredDirection(socialFact) === "undirected"){
			if(socialFact.first === characterName || socialFact.second === characterName){
				indicesToRemove.push(i);
			}
		}
	}

	for(var j = indicesToRemove.length - 1; j >= 0; j -= 1){
		socialRecord[currentTimeStep].splice(indicesToRemove[j], 1);
	}
};

var removeDirectedSocialFacts = function(characterName){
	//TODO: Validate that characterName is an actual character in the system.
	var indicesToRemove = [];
	for(var i = 0; i < socialRecord[currentTimeStep].length; i +=1){
		var socialFact = socialRecord[currentTimeStep][i];
		if(getRegisteredDirection(socialFact) === "directed"){
			if(socialFact.first === characterName || socialFact.second === characterName){
				//This means that we are dealing with someone who has a directed attribute to or from the 'name' character.
				indicesToRemove.push(i); // store for removal later; removing now would mess up our pass through the array.
			}
		}
	}

	for(var j = indicesToRemove.length - 1; j >= 0; j -= 1){
		//We want to go backwards, so as not to disrupt the ordering of the indexes we've marked for removal.
		socialRecord[currentTimeStep].splice(indicesToRemove[j], 1);
	}
};

var removeReciprocalSocialFacts = function(characterName){
	//TODO: Validate that characterName is an actual character in the system.
	var indicesToRemove = [];
	for(var i = 0; i < socialRecord[currentTimeStep].length; i += 1){
		var socialFact = socialRecord[currentTimeStep][i];
		if(getRegisteredDirection(socialFact) === "reciprocal"){
			if(socialFact.first === characterName || socialFact.second === characterName){
				//Anything that involves this character is going to be removed.
				indicesToRemove.push(i);
			}
		}
	}

	for(var j = indicesToRemove.length - 1; j >= 0; j -= 1){
		//we want to go backwards, so as not to disrupt the ordering of the indexes we've marked for removal.
		socialRecord[currentTimeStep].splice(indicesToRemove[j], 1);
	}
};

var getOffstageCharacters = function(){
	return offstageCharacters;
};

var getEliminatedCharacters = function(){
	return eliminatedCharacters;
};

//TODO: this is now redundant with ensemble.get()
var publicGet = function (predicate, earliestTime, latestTime, useDefaultValue, params) {
	return get(predicate, earliestTime, latestTime, useDefaultValue, params);
};

var init = function(initialTimeStep) {
	if (initialTimeStep !== undefined) {
		currentTimeStep = initialTimeStep;
	}
	//offstageCharacters = [];

};

var socialRecordInterface = {
	init: init,
	dumpSocialRecord: dumpSocialRecord,
	getSocialRecordCopy: getSocialRecordCopy,
	getSocialRecordCopyAtTimestep: getSocialRecordCopyAtTimestep,

	getCurrentTimeStep		: getCurrentTimeStep,

	registerMaxValue		: registerMaxValue,
	getRegisteredMaxValue	: getRegisteredMaxValue,
	registerMinValue		: registerMinValue,
	getRegisteredMinValue	: getRegisteredMinValue,
	registerDuration 		: registerDuration,
	getRegisteredDuration 	: getRegisteredDuration,
	registerDirection 		: registerDirection,
	getRegisteredDirection 	: getRegisteredDirection,
	registerDefault 		: registerDefaultValue,
	getRegisteredDefault 	: getRegisteredDefaultValue,
	registerIsBoolean 		: registerIsBoolean,
	getRegisteredIsBoolean 	: getRegisteredIsBoolean,
	clearHistory 			: clearHistory,
	clearEverything			: clearEverything,
	set 					: set,
	get 					: publicGet,
	setById					: setById,
	addHistory				: addHistory,
	socialRecordHistoryToString 	: socialRecordHistoryToString,
	socialRecordFullHistoryToString	: socialRecordFullHistoryToString,
	putCharacterOffstage	: putCharacterOffstage,
	putCharacterOnstage		: putCharacterOnstage,
	eliminateCharacter		: eliminateCharacter,
	getIsCharacterOffstage  : getIsCharacterOffstage,
	getIsCharacterEliminated: getIsCharacterEliminated,
	getOffstageCharacters	: getOffstageCharacters,
	getEliminatedCharacters	: getEliminatedCharacters,
	setupNextTimeStep		: setupNextTimeStep
};
// See comment at top of Tests.js for explanation of below.

/* test-code */
socialRecordInterface.currentTimeStep = currentTimeStep;
socialRecordInterface.getLength = getLength;
socialRecordInterface.getCurrentTimeStep = getCurrentTimeStep;
socialRecordInterface.getLengthAtTimeStep = getLengthAtTimeStep;
/* end-test-code */

//public things removed and turned 'private'
//getLength 				: getLength,

return socialRecordInterface;

})();
// MODULE ruleLibrary
const ruleLibrary = (function(){
/**
* This is the class RuleLibrary
* Public methods are:
*
* calculateVolition
* runTriggerRules
*
* @class  RuleLibrary
* @private
*/
var ruleLibrary = {
	triggerRules : [],
	volitionRules : []
};

/**
* @description Runs a rule set over a cast of characters.
* First it temporarily stores a specific ruleSet from the ruleLibrary into an array called rules.
* For each rule in this array, the characters that apply to each rule are bound to that rule.
*
* @method runRules
* @memberof RuleLibrary
* @param {String} ruleSet	an array of rules to check for in the socialRecord
* @param {Array} cast		an array of characters we are interested in seeing if the provided rules apply to
* @param onMatchFunction	the function that we will apply if the rule(s) are found to be true
*/
var runRules = function (ruleSet, cast, onMatchFunction, params, unaffectedCharacters) {
	var rules = ruleLibrary[ruleSet];
	if (rules === undefined) return;
	for (var i = 0 ; i < rules.length ; i += 1) {
		//ASK -- leaving this in fow now until the 'additive addRuleSet' issue is resolved
		if(rules[i].conditions === undefined){
			throw new Error("runRules called for ruleSet '" + ruleSet + "' (length " + rules.length + ") but there are no conditions in rule " + i + ".");
		}
		if (rules[i].isActive === false) {
			continue;
		}
		var allPredicates = rules[i].conditions.concat(rules[i].effects);
		var uniqueBindings = getUniqueBindings(allPredicates);
		matchUniqueBindings(uniqueBindings, cast, onMatchFunction, rules[i], params, unaffectedCharacters);
	}
};


/**
* Finds the place-holders for the unique characters who appropriately apply to a given rule
* @method getUniqueBindings
* @memberof RuleLibrary
* @param {Array} ruleConditions	the conditions which need to have specific characters filled into roles first and (optionally) second.
* @return {Array} dictionary		each of the conditions will be stored in this dictionary, with keys
*/
var getUniqueBindings = function (ruleConditions) {
	var dictionary = {};
	for (var i = 0 ; i < ruleConditions.length ; i += 1) {
		var predicate = ruleConditions[i];			//store the current rule condition in a temp

		//if the dictionary does not have an entry for the current predicate's first, initialize it
		if (dictionary[predicate.first] === undefined) {
			dictionary[predicate.first] = "";		//possible optimization to change the initialization to zero
		}
		//and the same for the second entry in there is a second character in the predicate
		if (predicate.second !== undefined) {
			if (dictionary[predicate.second] === undefined) {
				dictionary[predicate.second] = "";
			}
		}
	}
	return dictionary;
};

/**
* A recursive method which fills the roles for unique bindings previously found with actual characters
*
* @method matchUniqueBindings
* @memberof RuleLibrary
* @param {Object} uniqueBindings	the dictionary of place-holders for unique characters to fill
* @param {Array} availableCastMembers	array of cast members who can potentially fill a unique role
* @param {Function} processResult 	the function which will process the result of the unique binding
* @param {Array} rule	the particular rule that needs to be applied
*/
var matchUniqueBindings = function (uniqueBindings, availableCastMembers, processResult, rule, params, unaffectedCharacters) {
	var isFilled = true;
	var emptyKey = "";

	//find an unbound key in the uniqueBindings dictionary
	for (key in uniqueBindings) {
		if (uniqueBindings[key] === "") {
			emptyKey = key;
			isFilled = false;
			break;
		}
	}

	// essentially our base case for the recursion
	// if all of the keys in the uniqueBindings dictionary have an entry
	if (isFilled === true) {
		// then recursion has bottomed out. we have a completely bound set of characters.
		var boundConditions = doBinding(uniqueBindings, util.clone(rule.conditions));	//characters are assigned

		//Because some characters might be offstage or eliminated, we might not want to
		//bother evaluating this rule. The only way we'll know for sure is by looking
		//at the effects. If they involve characters that are on our 'ignore' list,
		//then we'll want to skip evaluating this rule.
		//It's worth noting that one rule might have multiple effects, some of which
		//we want to ignore and others we don't. In that case, as long as one effect
		//is good, then we have to evaluate anyway. We'll let the respective
		//rule set handle ignoring the 'bad' effects inside of processResult.
		var boundEffects = doBinding(uniqueBindings, util.clone(rule.effects));
		var atLeastOneGoodEffect = false;
		for(var k = 0; k < boundEffects.length; k+=1){
			if(boundEffects[k].first !== undefined){
				if(unaffectedCharacters.indexOf(boundEffects[k].first) !== -1){
					//This is a "bad" effect -- it affects someone we are ignoring.
					continue;
				}
			}
			if(boundEffects[k].second !== undefined){
				if(unaffectedCharacters.indexOf(boundEffects[k].second) !== -1){
					//This is a "bad" effect -- it affects someone we are ignoring.
					continue;
				}
			}
			//If we've made it here, then at least one of the effects is something
			//that we'll want to enact if the condition evaluates to true.
			//That means we might as well start evaluating now!
			atLeastOneGoodEffect = true;
			break;
		}

		//Only bother evaluating if at least one effect involves characters that
		//we don't want to ignore (e.g., they aren't offstage, they aren't eliminated)
		var conditionsAreTrue = false;
		if(atLeastOneGoodEffect){
			conditionsAreTrue = evaluateConditions(boundConditions, rule, params);
		} 

		// All the conditions are true, so process all effects.
		if (conditionsAreTrue === true){
			var boundEffects = doBinding(uniqueBindings, util.clone(rule.effects));
			for (var j = 0 ; j < boundEffects.length ; j +=1 ) {
				processResult(boundEffects[j], boundConditions, rule, j, boundEffects.length-1);
			}
		}
	}
	// time to recurse
	else {
		// There are still some characters unbound: recurse down the chain with each
		// possible assignment for the first unbound slot.
		for (var i = 0 ; i < availableCastMembers.length ; i +=1) {
			uniqueBindings[emptyKey] = availableCastMembers[i];	// place an available cast member into the empty slot in the dictionary
			var updatedCastMembers = util.clone(availableCastMembers);
			updatedCastMembers.splice(i, 1);	// the updated cast has the currently assigned member removed for the recursion
			matchUniqueBindings(uniqueBindings, updatedCastMembers, processResult, rule, params, unaffectedCharacters);
		}
		//If we've gotten here, we want to 'clear out' the uniqueBindings slot of the current 'emptyKey'
		//Because we want it to be clear for when we pop back up to the previous level of recursion.
		uniqueBindings[emptyKey] = "";
	}
};

/**
 * evaluateConditions takes an array of bound conditions (that is, the first and second
 * role slots are "filled in" (i.e. first: "simon" as opposed to first: "x"), and for each one
 * of them checks, to see if they hold true. Returns true if all conditions are true. False otherwise.
 *
 * @method evaluateConditions
 * @memberof RuleLibrary
 * @param {Array} conditions An array of predicates representing the condition of a rule.
 * @return {Boolean} conditionsAreTrue Returns true if all of the predicates in the conditions array is true. Returns False otherwise.
 */
/*
var evaluateConditions = function(conditionsArray, rule, params){
	var orderedConditions = [];
	var conditions = util.clone(conditionsArray);
	var counter = conditions.length;

	for (var i = 0 ; i < counter ; i += 1) {

		// in the case of an ordered condition array, if a mistake was made and there is a gap
		// i.e. 1,2,4,5, skip the undefined entry and continue
		if (conditions[i] === undefined) {
			counter += 1;
			continue;
		}

		var condition = conditions[i];
		var earlyTime = 0;
		var latestTime = 0;

		//Let's do it with default time steps too!
		if(condition.timeEarliest !== undefined){
			earlyTime = condition.timeEarliest;
		}
		if(condition.timeLatest !== undefined){
			latestTime = condition.timeLatest;
		}

		// Put the ordered conditions in an ordered array
		
		if(condition.order !== undefined) {
			var tempCondition = util.clone(condition);
			if (tempCondition.order === -1){
				delete tempCondition.order;
				delete tempCondition.timeEarliest;
				delete tempCondition.timeLatest;
				if(tempCondition.class === "SFDBLabel"){
					console.log("Dealing with my thing...");
				}
				var results = sfdb.get(tempCondition, earlyTime, latestTime);
				if (results.length === 0) {
					return false;
				}
				else {
					// only do this if the next condition is defined, otherwise we're done!
					if(conditions[i+1] !== undefined) {
						conditions[i+1].timeLatest -= results[0].timeFoundOffset;	// this offset is the time that the predicate was found
					}																// less the earliest time the get method started looking for it
					continue;														// e.g. we are at time step 10, earliestTime = 4, so we began looking for
				}																	// it at time step 6, found it at step 7, so 7-6 gives us an offset of 1
			}																		// and we add 1 to it so we begin our next pass 1 step past step 7 (i.e. 8)
			else {
				var tempCondition = util.clone(condition);
				var orderNumber = tempCondition.order;
				tempCondition.order = -1;	// let us know that we've already found this predicate to be ordered
				orderedConditions[orderNumber] = tempCondition;
				continue;
			}
		}

		//Here is where we should 'modify' this predicate based on certain default
		//assumptions. For example, a condition predicate that is a 'status' we
		//want to default to having the value true (right? Because that is the way more
		//more common case). There may be enough of these conventions that it should be
		//separated out into it's own file, but for now, let's just do the status thing.
		// TODO: change to default value here
		if(condition.value === undefined && sfdb.getRegisteredIsBoolean(condition) === true) {
		 	//condition.value = sfdb.getRegisteredDefault(condition);
		 	condition.value = true;
		}
		//condition.earliestTime and condition.latestTime mess up 'get', because things STORED in the
		//sfdb don't have earliest and latest times, so they don't match. delete them for now, and give them back
		//at the end of the function
		var searchCondition = util.clone(condition);
		delete searchCondition.timeEarliest;
		delete searchCondition.timeLatest;

		var results = sfdb.get(searchCondition, earlyTime, latestTime);	//zeros signify currentTimeStep


		// If no match was found, this condition is false; so this
		// whole predicate must be false..
		if (results.length === 0) {
			// This check can be used to show why a trigger rule failed for a particular rule and character(s). In ensembleBridge when runTriggerRules is called, add as a final param an object with key "monitor" and a value of the name of the rule to track.
			if (params && params.monitor === rule.name) {
				if (params.first && params.first !== condition.first) {
				} else {
					if (params.second && condition.second && params.second !== condition.second) {
					} else {
						console.log("***Failed rule '" + rule.name + "' because condition #" + i + " was not true in sfdb at earlyTime " + earlyTime + ", latestTime " + latestTime + ". searchCondition:", searchCondition, ". results:", results);
					}
				}
			}

			return false;
		}
	}

	if(orderedConditions.length > 0){
		return evaluateConditions(orderedConditions);
	}

	//If we got here, that means that we want to return true -- all of the conditions checked out!
	return true;
};*/

//TODO: Write a function comment block for this guy
//TODO: Do we still use 'rule' and 'params' here!?!? Can we get rid of them!?!
var evaluateConditions = function(conditionsArray, rule, params){

	// if(conditionsArray.length >= 3 && conditionsArray[2].class === "SFDBLabel" && conditionsArray[2].first === "clara" && conditionsArray[2].second === "reggie"){
	// 	console.log("match..");
	// }
	var sortedConditions = sortConditionsByOrder(conditionsArray);
	var condition;
	var orderCounter = - 9999;
	var timeStart = 0;
	var timeEnd;
	if(params !== undefined && params.timeStep !== undefined){
		timeEnd = params.timeStep;
	}
	else{
		timeEnd = socialRecord.getCurrentTimeStep();
	}
	var timeOfLastMatch = -1;
	var currentTimeStep = timeEnd;
	var results;
	for(var i = 0; i < sortedConditions.length; i += 1){
		condition = sortedConditions[i];
		var largerRelTime = 0;
		var smallerRelTime = 0;

		//Let's do it with default time steps too! Our validator should have verified if this exists, it's a tuple of integers or special words ordered with the lowest first.
		if(condition.turnsAgoBetween !== undefined){
			smallerRelTime = condition.turnsAgoBetween[0];
			if (typeof smallerRelTime === "string") {
				if (smallerRelTime.toLowerCase() === "now") {
					smallerRelTime = 0;
				}
				else if (smallerRelTime.toLowerCase() === "start") {
					smallerRelTime = currentTimeStep;
				}
			}
			largerRelTime = condition.turnsAgoBetween[1];
			if (typeof largerRelTime === "string") {
				if (largerRelTime.toLowerCase() === "now") {
					largerRelTime = 0;
				}
				else if (largerRelTime.toLowerCase() === "start") {
					largerRelTime = currentTimeStep;
				}
			}
		}

		// assert that the times are properly ordered.
		if (smallerRelTime > largerRelTime) {
			throw new Error("found smallerRelTime " + smallerRelTime + " and largerRelTime " + largerRelTime);
		}

		//TODO: This seems to be an attempt at the 'defualt values' note in the google doc, but it doesn't appear to be working.
		//For one thing, it isn't actually looking up a stored default value, it just assumes to be true.
		//Here is where we should 'modify' this predicate based on certain default
		//assumptions. For example, a condition predicate that is a 'status' we
		//want to default to having the value true (right? Because that is the way more
		//more common case). There may be enough of these conventions that it should be
		//separated out into it's own file, but for now, let's just do the status thing.
		// TODO: change to default value here
		if(condition.value === undefined && socialRecord.getRegisteredIsBoolean(condition) === true) {
			//condition.value = sfdb.getRegisteredDefault(condition);
			condition.value = true;
		}

		//condition.turnsAgoBetween mess up 'get', because things STORED in the
		//sfdb don't have earliest and latest times, so they don't match. delete them for now, and give them back
		//at the end of the function
		var searchCondition = util.clone(condition);
		delete searchCondition.turnsAgoBetween;


		if(searchCondition.order === undefined){
			//Normal Evaluation. 
			results = socialRecord.get(searchCondition, smallerRelTime, largerRelTime, true, params);	//zeros signify currentTimeStep
			// If no match was found, this condition is false; so this
			// whole predicate must be false..
			if (results.length === 0) {
				//No results found! Must not be true!
				return false;
			}
		}
		else{
			//Ordered Evaluation.
			
			//Check to see if we've entered a new order group (e.g. previously order was 0, now order is 1)
			if(searchCondition.order > orderCounter){
				//we are in a new order group! -- might have to do a special check here for the 'first' time we get here.
				timeStart = currentTimeStep - (timeOfLastMatch + 1);
				timeEnd = smallerRelTime;
				orderCounter = searchCondition.order;
			}

			//See if the window specified by the predicate affects where we are allowed to start.
			if(largerRelTime < timeStart){
				timeStart = largerRelTime;
			}

			if(smallerRelTime > timeEnd){
				timeEnd = smallerRelTime;
			}

			if(timeEnd > timeStart){
				return false; // the 'start point' is already PAST the acceptable end point, which means it is impossible for us to succeed.
			}

			results = socialRecord.get(searchCondition, timeEnd, timeStart );

			if (results.length === 0) {
				//No results found! Must not be true!
				return false;
			}

			//TODO: This may not actually work if multiple matches are found... write unit tests or something!
			//TODO: Changing 'timeHappened' doesn't seem to actually make any differences. OH WAIT, unless
			//it isn't actually updating!?!?! Ok it is. So, that means that I have no idea why one is working and the other isn't.
			if(results[0].timeHappened > timeOfLastMatch){
				timeOfLastMatch = results[0].timeHappened;
				//timeHappened -- the thing I added into set (what I think would work);
			}

		}
	}

	//If we got here, that means that we want to return true -- all of the conditions checked out!
	return true;
};

/**
 * @function sortConditions
 * @description Given an array of predicates (ideally one from the condition of a rule) sorts them based on the value of their 'order' field. Not every predicate will have order specified; The returned array will have undefined order predicates first, followed by predicates with order in ascending order.
 * @private
 * @param  {[array]} conditions [An array filled with the condition predicates from a rule]
 * @return {[array]}            [The conditions sorted on the key "order" in ascending order (undefined orders will appear first in the array.)]
 */
var sortConditionsByOrder = function(conditions){
	var nonOrderConditions = [];
	var orderConditions = [];
	var sortedConditions = [];
	var i;
	//Figure out which condition predicates have order specified, and which predicates do not.
	//TODO: This step may be extraneous, the _ sortBy function might get the job done automatically,
	//but this definitely ensures that the final array will be in the form we want. Look into removing this if need be.
	for(i = 0; i < conditions.length; i += 1){
		if(conditions[i].order === undefined){
			nonOrderConditions.push(conditions[i]);
		}
		else{
			orderConditions.push(conditions[i]);
		}
	}

	//Sort the order conditions BY thier order.
	orderConditions = _.sortBy(orderConditions, "order");

	//Make one super array! Orderless predicates come first, then order specified predicates.
	for(i = 0; i < nonOrderConditions.length; i += 1){
		sortedConditions.push(nonOrderConditions[i]);
	}
	for(i = 0; i < orderConditions.length; i += 1){
		sortedConditions.push(orderConditions[i]);
	}

	return sortedConditions;
};

/**
* A (smallish) array of characters to fill each needed role in a (condition) predicate is passed in,
* and an array with these characters filling rolls is returned.
*
* @method doBinding
* @memberof RuleLibrary
* @param {Object} characters	a dictionary of characters to bind to predicates
* @param {Object} predicates	a clone of the array of predicates that needs characters assigned to each of its roles
* @return {Array} resultsArray an array of the conditions that have characters bound to their roles
*/
var doBinding = function (characters, predicates) {
	var resultsArray = [];	//array to hold our conditions that have characters bound to roles in each entry
	for (var i = 0 ; i < predicates.length ; i += 1) {
		var predicate = predicates[i];	// current predicate to consider
		predicate.first = characters[predicate.first];	// bind a character to the role that only had a place-holder

		//and do that same for the second role, if there is a second role to fill
		if (predicate.second !== undefined) {
			predicate.second = characters[predicate.second];
		}
		resultsArray.push(predicate);
	}
	return resultsArray;
};

/**
* @description  Run the socialRecord's appropriate trigger rules with a given cast. The effects of trigger rules are always applied to the current timestep.
*
* @method runTriggerRules
* @memberof ensemble
* @param {Array} cast - the array of cast members
* @param {Object} params A means of passing down additional debugging information, as well as alter the default behavior of calculating volition. The key/value pairs for params are: <BR>
<b>timestep (Number):</b> This tells ensemble to consider the number assigned to the 'timestep' attribute as the "current turn" for the purposes of volition calculation.
@example var params = {}; params.timestep = 3;
var cast = ["Bob", "Carol", "Xander"];
var triggerResults = ensemble.runTriggerRules(cast, params); //the act of calling runTriggerRules has now changed the state.
* @return {Object} An object representing the changes made to the social state as a result of running these trigger rules.
*/
var runTriggerRules = function (cast, params) {
			// Construct an array of fired trigger rules.
	var triggerObj = {};
	triggerObj.explanations = [];
	triggerObj.effects = [];
	triggerObj.inCharMsgs = [];
	var explanation = "";

	//Construct a list of characteres to ignore.
	//For now, let's just say that it's the same as the eliminated characters
	//(we still want offstage characters to be involved, for the sake of
	//perfect information.)
	//Note -- we need to still be a little cautious, because there may be instances where
	//a trigger had two effects: one we want to run, and one that involves 'characters to ignore'
	//So we still need to do another check here!
	var charactersToNotBeTheSubjectOrObjectOfTriggerRules = [];
	var eliminatedCharacters = socialRecord.getEliminatedCharacters();
	charactersToNotBeTheSubjectOrObjectOfTriggerRules = util.clone(eliminatedCharacters);


	var processRuleEffects = function (effect, conditions, rule, effectNumber, lastNumber) {
		if (effectNumber === 0) {
			explanation = "TRIGGER RULE: Because ";
			for (var i = 0; i < conditions.length; i++) {
				explanation += i + ") " + predicateToEnglish(conditions[i]).text + (i+1 === conditions.length? "":" ");
			}
			explanation += ", now ";
		} else {
			explanation += " and ";
		}
		explanation += predicateToEnglish(effect).text;
		if(isEffectValid(effect, charactersToNotBeTheSubjectOrObjectOfTriggerRules)){
			socialRecord.set(effect);
			triggerObj.effects.push(effect);
		}
		if (effectNumber === lastNumber) {
			triggerObj.inCharMsgs.push(rule.msg || "I feel different...");
			triggerObj.explanations.push(explanation);
		}
	};


	runRules("triggerRules", cast, processRuleEffects, params, charactersToNotBeTheSubjectOrObjectOfTriggerRules);

	return triggerObj;
};

/**
 * @function isEffectValid
 * @description When running trigger rules or calculating volitions, there is a chance that
 * it might involve characters that are offstage, eliminated, or that should otherwise be ignored.
 * This function does one final check to make sure that the effect in question doesn't include
 * any such characters. 
 * @param  {[Object]} effect             [The effect. By this point, it should be bound with character names]
 * @param  {[Array]} charactersToIgnore [A list of characters that have been deemed to be ignored.]
 * @return {[Bool]}                    [Returns true if the effect is 'safe' to be set or used for volition. False otherwise.]
 */
var isEffectValid = function(effect, charactersToIgnore){
	for(var i = 0; i < charactersToIgnore.length; i += 1){
		if(effect.first !== undefined){
			if(effect.first === charactersToIgnore[i]){
				return false;
			} 
		}
		if(effect.second !== undefined){
			if(effect.second === charactersToIgnore[i]){
				return false;
			}
		}
	};
	return true;
};

/**
* @description Calculate the volitions of each character in the given cast. Each character in the cast will form volitions for every other character in the cast, for each intent.
*
* @method calculateVolition
* @memberof ensemble
* @param {Array} cast An array of the cast of characters to calculate volition for.
@param {Object} params A means of passing down additional debugging information, as well as alter the default behavior of calculating volition. The key/value pairs for params are: <BR>
<b>timestep (Number):</b> This tells ensemble to consider the number assigned to the 'timestep' attribute as the "current turn" for the purposes of volition calculation.
* @example var storedVolitions = ensemble.calculateVolition(cast); 
*@return {Object} A dictionary containing the cast and their volitions
*/
var calculateVolition = function (cast, params) {

	// We punt most of the work of dealing with the volitions object to the Volitions module. More documentation is there. The object we get below is a dictionary with a [first][second] structure for every combination of cast pairs, with the contents initially an empty array which we will add volition predicates to.
	var calculatedVolitions = volition.newSet(cast);

	//Not to be confused -- these characters are STILL
	//important in the cacluation process, we just don't
	//want THEIR volitions towards anyone, nor do we want
	//anyone's volitions towards them. Think "offstage"
	//in prom week.
	//In this case, it is as simple as taking everyone
	//from the offstage list and the eliminated list
	//and lumping them together here.
	var charactersToSkipVolitionCalculation = [];
	var offstageCharacters = socialRecord.getOffstageCharacters();
	var eliminatedCharacters = socialRecord.getEliminatedCharacters();
	for(var i = 0; i < offstageCharacters.length; i += 1){
		if(charactersToSkipVolitionCalculation.indexOf(offstageCharacters[i]) === -1){
			charactersToSkipVolitionCalculation.push(offstageCharacters[i]);
		}
	}
	for(i = 0; i < eliminatedCharacters.length; i += 1){
		if(charactersToSkipVolitionCalculation.indexOf(eliminatedCharacters[i]) === -1){
			charactersToSkipVolitionCalculation.push(eliminatedCharacters[i]);
		}
	}


	// The "do the work" function we'll pass down the recursion chain.
	// "effect" is a single effect predicate,
	// which should have these fields:
	//
	// "first": a character
	// "second"
	// "category": a category of abstract predicate ("relationship", "trait", etc.)
	// "type": The kind within that category ("friend", "shy", etc.)
	// "weight": The amount to adjust the weight up or down
	// "intentType": true or false, for a desire to adjust this network up
	// or down. (or to make true or false, for booleans).
	var adjustWeight = function (effect, condition, rule) {
		
		var result = util.clone(effect);
		var skipToNextPredicate = false;
		delete result.weight;

		//And now here we need to do one last check to make sure that a 'bad' effect
		//didn't hitch a ride with a 'good' effect.
		//That is to say: we don't want to adjust any volitions for or to people on our
		//'ignore' list.
		if(!isEffectValid(effect, charactersToSkipVolitionCalculation)){
			return;
		}
		/*
		if(effect.first !== undefined && charactersToSkipVolitionCalculation.indexOf(effect.first) !== -1){
			return;
		}
		if(effect.second !== undefined && charactersToSkipVolitionCalculation.indexOf(effect.second) !== -1){
			return;
		}
		*/
		// loop through all of the effects in the calculatedVolitions that pertain to a particular pair of characters
		//ASK: (speed optimization) This definitely gets the job done, but it also seems like perhaps this loop is unnecessary?
		//Because we've parsed the blueprints, we know all of the potential types of intents there are. wouldn't
		//it be faster to simply dynamically construct all of the potential keys in the array ahead of time,
		//and then directly update/adjust the value at that spot in the array.
		
		//TODO: currently, adjustWeight cannot handle a situation where there is no second person in the effect. We might want to handle this.
		var direction = socialRecord.getRegisteredDirection(effect);
		//console.log(direction);
		if(effect.second === undefined){
			if(direction === "undirected" ){
			//ok, we are dealing with a situation where a character is attempting to adjust an undirected property.
			//Do this by making the 'second' character actually the first.
			effect.second = effect.first;
			}
		}
		var lengthOfPairsEffectsArray = calculatedVolitions[effect.first][effect.second].length;
		for (var i = 0 ; i <= lengthOfPairsEffectsArray ; i += 1) {

			// we haven't found this effect in the array yet,
			// and we are at its end, so make one and insert it
			if (i === lengthOfPairsEffectsArray) {

				result.weight = 0;
				result.weight += effect.weight;
				result.englishInfluences = [];

				//Store stuff for rule 'diagnostics' -- we can see where a rule came from, and why this rule fired,
				//and how much influence it had over this particular volition
				var englishData = [];
				var englishInfluence = predicateArrayToEnglish(condition);
				englishData["englishRule"] = englishInfluence;
				englishData["ruleName"] = rule.name;
				englishData["weight"] = result.weight;
				englishData["origin"] = rule.origin;
				result.englishInfluences.push(englishData);

				calculatedVolitions[effect.first][effect.second].push(result);
				break;
			}

			var currentVolition = calculatedVolitions[effect.first][effect.second][i];
			for (var key in result) {
				if(key === "englishInfluences"){
					continue; // ignore this key.
				}
				if (result[key] !== currentVolition[key]) {
					skipToNextPredicate = true;
					break;
				}
			}
			if (skipToNextPredicate === true) {
				skipToNextPredicate = false;
				continue;
			}
			else {		// found the effect that needs to be updated
				currentVolition.weight += effect.weight;

				var englishData = [];
				var englishInfluence = predicateArrayToEnglish(condition);
				englishData["englishRule"] = englishInfluence;
				englishData["ruleName"] = rule.name;
				englishData["weight"] = effect.weight;
				englishData["origin"] = rule.origin;

				currentVolition.englishInfluences.push(englishData);

				//Ok! And now let's actually sort the english influences based on the weight
				//so most important comes first!
				currentVolition.englishInfluences.sort(function(a,b){
					return (a["weight"] < b["weight"]) ? 1 : ((b["weight"] < a["weight"]) ? -1 : 0);
				});

				break;	// there will only be one unique effect to update, so we are done; break out of the loop
			}
		}
	};
	//var params = {}; // TODO: Remove params from runRules entirely? 
	

	runRules("volitionRules", cast, adjustWeight, params, charactersToSkipVolitionCalculation);

	// volition.register will sort the volitions and create an interface into this set, which we label "main".
	// TODO: if multiple volition sets are needed at some point (perhaps to calculate just-in-time volitions,
	// or a separate set for off-stage characters), this should be refactored so a key is passed into this function.
	return volition.register("main", calculatedVolitions);
};

/**
 * @description Stores a set of rules in the appropriate spot in the rules library. NOTE That this should only be used internally, not by unit tests or the public, since it skips data validation steps.
 * Additive
 *
 * @method addRuleSet
 * @memberof RuleLibrary
 * @param {String} key The identifier for this set of rules.
 * @param {Array} set The array containing the rule object definitions.
 */
var addRuleSet = function(key, set) {
	if (ruleIndexes[key] === undefined) {
		ruleIndexes[key] = {};
	}
	for(var i = 0; i < set.length; i++){
		if(isRuleAlreadyInRuleSet(key, set[i])){
			console.log("Warning! You are adding the rule '" + 
				set[i].id + "' (" + predicateToEnglish(set[i]).text + "), from " + set[i].origin + ", but that rule is identical to one already loaded.", set[i]);
		}
		addRule(key, set[i]); 

		// Set up a cross-reference so we can look up rules by ID.
		var rule = set[i];
		if (rule.id) {
			var lastPos = ruleLibrary[key].length - 1;
			ruleIndexes[key][rule.id] = lastPos;
		}
	}
};

var ruleIndexes = {};

/**
 * @descriptionStores a new rule in the appropriate key in last spot in the rules library.
 * @method addRule
 * @memberof RuleLibrary
 * @param {String} key The identifier for this set of rules.
 * @param {Object} rule The object containing the rule definition to add.
 */
var addRule = function (key, rule) {
	if (ruleLibrary[key] === undefined) {
		ruleLibrary[key] = [];
	}
	ruleLibrary[key].push(rule);
};

/**
 * @method isRuleAlreadyInRuleSet
 * @memberof RuleLibrary
 *
 * This function takes in a key for a rule set (e.g. "volitionRules" or "triggerRules") and a rule,
 * and checks to see if that rule already exists inside of the specified rule set. If it does
 * it will return a clone of the found rule. If it does not, it will return false.
 *
 * ASSUMES THAT rules, when parsed in, have their predicates sorted in some way for consistency!!!!
 * TODO: Make it so that rules get their predicates sorted when parsed in OR make this function not care about ordering.
 *
 * @param {String} key the identfier for this set of rules.
 * @param {Object} rule the rule that we are checking to see if it already exists in the rule library
 *
 * @return if the rule already exists in the rule set, returns a copy of that rule. Otherwise returns false.
 */
var isRuleAlreadyInRuleSet = function(key, rule){
	//Let's loop through all of the rules at this spot in the ruleLibrary, and see if this rule already lives inside of it.
	var storedRule;
	var couldBeDuplicateRule = true;
	if(ruleLibrary[key] !== undefined){ //only want to do this if we're dealing with a defined key!
		for(var i = 0; i < ruleLibrary[key].length; i += 1){
			storedRule = ruleLibrary[key][i];
			if(areRulesEqual(storedRule, rule) === true){
				//oh oh, we in fact already have this rule in the rule set! return true
				return true;
			}
		}
	}
	//if we made it to this point, it must mean that the rule is not already in the rule set!
	return false;
};

/**
 * @method arePredicatesEqual
 * @memberof RuleLibrary
 *
 * @description Given two predicates, check to see if they are equal to each other. It is difficult to tell if predicates
 * are equal to each other, because depending on the context, different predicates will have different fields
 * specified. For example, the "weight" field will only ever be in an effect predicate. Moreover, it will only
 * ever be in an effect predicate in a VOLITION rule; a trigger rule won't have a weight.' This function essentially
 * goes through each one of these fields, and checks to see if they are the same for both of the predicates. If they
 * are, then return true. If not, return false.
 *
 *
 * @param {Object} pred1 One of the two predicates we are testing for equality.
 * @param {Object} pred2 The second of the two predicates we are testing for equality.
 * @return true if pred1 and pred2 are equal. False otherwise.
 */
var arePredicatesEqual = function(pred1, pred2){

	//first simple test! do these two guys have the same number of attributes?
	//If not, then heck, we know they are definitely not equal.
	if(_.size(pred1) !== _.size(pred2)){
		return false;
	}

	//ok, we now know that they have the same number of attributes.
	//I think now it is actually a pretty simple task of looping thorugh these attributes
	//and comparing them to each other!

	for(var key in pred1){
		if (util.isArray(pred1[key]) && util.isArray(pred2[key])) {
			// Technically, we should compare each array value; but for now, the only field that can be an array is turnsAgoBetween, and we'll ignore that for now. (Complex b/c tuple keys could be in diff. order and still be considered equal, 0 === "NOW", etc.)
			continue;
		}
		if (pred1[key] !== pred2[key]){
			return false;
		}
	}

	return true;
};

/*
 * @method areRulesEqual
 * @memberof RuleLibrary
 *
 * @description This method is given two rules to compare if they are 'equal' to each other. equal,
 * for purposes of this method, means that all of the predicates of these two rules match.
 * Right now, this function ASSUMES that the ORDERING of the predicates is uniform. However
 * that is a potentially dangerous assumption, unless we implement some form of pre-processing that
 * helps with the ordering.
 * TODO: Do we want to enforce an ordering? Or change this function to be a little more robust?
 *
 * @param {object} rule1 one of the two rules we are comparing
 * @param{object} rule2 the second of the two rules we are comparing
 * @return true if the two rules are equal, false if otherwise.
 */
var areRulesEqual = function(rule1, rule2){

	//first, let's do the easy check to see if the lengths of the conditions and/or effects are different.
	//Made, I suppose, a little more complicated because some rules might not have conditions or effects specified.
	if(rule1.conditions === undefined && rule2.conditions !== undefined ||
		rule1.conditions !== undefined && rule2.conditions === undefined){
			//one of these rule has a condition set, adn the other one doesn't. not equal! return false!
			return false;
		}
	if(rule1.effects === undefined && rule2.effects !== undefined ||
		rule1.effects !== undefined && rule2.effects === undefined){
			//one of these rules has an effect and the other one doesn't. not equal return false!'
			return false;
		}

	//Ok, if we've gotten here, let's start stepping through the conditions one by one.
	if(rule1.conditions !== undefined && rule2.conditions !== undefined){
		if(rule1.conditions.length !== rule2.conditions.length){
			return false; // they had a different number of conditions! Must be different!
		}
		else{
			//the conditions are the same length, great!
			for(var i = 0; i < rule1.conditions.length; i += 1){
				var result = arePredicatesEqual(rule1.conditions[i], rule2.conditions[i]);
				if(result !== true){
					//This means that there was a difference between the two rules! Let's return false!
					return false;
				}
			}
		}
	}

	//And now, let's loop through all of the effects!
	if(rule1.effects !== undefined && rule2.effects !== undefined){
		if(rule1.effects.length !== rule2.effects.length){
			return false; // they had a different number of effects! Must be different!
		}
		else{
			//The effects are the same length, great!
			for(var j = 0; j < rule1.effects.length; j += 1){
				result = arePredicatesEqual(rule1.effects[j], rule2.effects[j]);
				if(result !== true){
					//This means that the two rules have a different effect. Let's return false!
					return false;
				}
			}
		}
	}

	//If we've gotten to this point, it must mean that the two rules are identical!
	return true;
};

/**
 *@method ruleToEnglish
 *@memberof ensemble
 *@public
 * 
 * @description Given a rule, return a string that is a rough english description of what the rule is by converting each of its 
 component predicates to english.
 *
 * @param {Object} rule An ensemble rule (likely either a volition rule or a trigger rule) that you would like to be roughly converted into english.
   * @example var englishRule = ensemble.ruleToEnglish(myRule);
 *@return {String}      A string with an english description of the contents of the rule.
 * 
 */
var ruleToEnglish = function(rule){
	var returnString = "If: ";
	returnString += predicateArrayToEnglish(rule.conditions, false);
	returnString += ", Then: ";
	returnString += predicateArrayToEnglish(rule.effects, true);
	return returnString;
};



var predicateArrayToEnglish = function(conditions, isEffect){
	var returnString = "";
	for(var i = 0; i < conditions.length; i += 1){
		if(i >= 1){
			returnString += ", and ";
		}
		returnString += predicateToEnglish(conditions[i]).text;
	}
	return returnString;
};

/**
 *@method predicatetoEnglish
 *@memberof ensemble
 *@public
 * 
 * @description Given a predicate (such as you might find in the conditions or effects of a rule)
 * return an english description of it.
 *
 * @param {Object} pred An ensemble predicate that you would like to be roughly converted into english.
   * @example var englishPredicate = ensemble.predicateToEnglish(myPredicate);
 *@return {String}      A string with an english description of the contents of the predicate.
 * 
 */
var predicateToEnglish = function(pred) {
	var result = [];
	var addPhrase = function(text, label, optMeta) {
		var ph = {};
		ph.text = text;
		ph.label = label || "";
		if (optMeta !== undefined) {
			ph.meta = optMeta;
		}
		result.push(ph);
	}

	if (pred.name || pred.first === undefined) {
		// For complicated predicates, for now just return the human-authored rule name.
		var o = {};
		o.text = pred.name;
		return o;
	}

	var isBoolean = socialRecord.getRegisteredIsBoolean(pred);
	var directionType = socialRecord.getRegisteredDirection(pred);
	var duration = socialRecord.getRegisteredDuration(pred);
	var isPersistent = (duration !== 0) ? true : false;

	var nameFirst = pred.first;
	var nameSecond = pred.second !== undefined ? pred.second : "";

	var predType = "fact";
	if (pred.operator && ["+", "-"].indexOf(pred.operator) >= 0) {
		predType = "change";
	}
	if (pred.operator && [">", "<", "="].indexOf(pred.operator) >= 0) {
		predType = "compare"
	}
	if (pred.weight !== undefined) {
		predType = "volition"
	}

	var isWord = "is";
	var hasWord = "has";
	var moreRecent, lessRecent;
	if (pred.turnsAgoBetween !== undefined) {
		moreRecent = pred.turnsAgoBetween[0];
		lessRecent = pred.turnsAgoBetween[1];
		if (moreRecent === "NOW") moreRecent = 0;
		if (lessRecent === "NOW") lessRecent = 0;
		if (moreRecent === "START") moreRecent = Infinity;
		if (lessRecent === "START") lessRecent = Infinity;
		if (moreRecent === 0 && lessRecent === 0) {
			// Leave as is; skip further custom text.
			moreRecent = undefined;
			lessRecent = undefined;
		}
		else if (moreRecent === 0) {
			isWord = "has been";
			hasWord = "has had";
		} else {
			isWord = "was";
			hasWord = "had";
		}
	}
	var notWord = (pred.value === false ? " not" : "")
	var directionWord;
	switch(pred.operator) {
		case "+": directionWord = "more"; break;
		case ">": directionWord = "more than"; break;
		case "-": directionWord = "less"; break;
		case "<": directionWord = "less than"; break;
		default: directionWord = "exactly"; break;
	}
	// var directionWord = (pred.operator !== undefined && ["+", ">"].indexOf(pred.operator) >= 0) ? "more" : "less";
	// directionWord
	if (pred.weight !== undefined) {
		if (pred.weight === 0) directionWord = "unchanged";
		else directionWord = pred.weight > 0 ? "more" : "less";
	}

	if (predType === "fact" || predType === "compare") {
		addPhrase(nameFirst, "first");
		if (!isPersistent) {
			var didWord = (pred.value === true || pred.value === undefined ? "did" : "did not do");
			addPhrase(didWord, "beVerb");
			addPhrase("something");
		}
		else if (isBoolean) {
			addPhrase(isWord+notWord, "beVerb");
		} else {
			addPhrase(hasWord);
			addPhrase(directionWord, "direction");
			addPhrase(pred.value, "value");
		}
	}
	if (predType === "change") {
		addPhrase(nameFirst, "first");
		addPhrase(hasWord);
		addPhrase(pred.value, "value");
		addPhrase(directionWord, "direction");
	}
	if (predType === "volition") {
		var intentWord = pred.intentType === true ? "become" : "stop being";
		if (!isBoolean) {
			intentWord = pred.intentType === true ? "increase" : "decrease";
		}
		addPhrase(nameFirst, "first");
		addPhrase(hasWord, "beVerb");
		addPhrase(directionWord, "..");
		addPhrase("volition");
		var sign = pred.weight >= 0 ? "+" : "";
		addPhrase("(");
		addPhrase(sign+pred.weight, "weight");
		addPhrase(")");
		addPhrase("to");
		addPhrase(intentWord, "intentType");
	}

	addPhrase(pred.type, "type", pred.category);

	if (directionType !== "undirected") {
		var helper = "";
		if (!isPersistent) {
			helper = "to";
		} else if (!isBoolean) {
			helper = "for";
		}
		addPhrase(helper);
		addPhrase(nameSecond, "second");
	}

	// Explanation of past tense parameters.
	if (moreRecent !== undefined) {
		addPhrase("", "timeOrderStart");
		var printedMoreRecent = pred.turnsAgoBetween[0];
		if (printedMoreRecent === "NOW") {
			printedMoreRecent = 0;
		}
		var printedLessRecent = pred.turnsAgoBetween[1];
		if (printedLessRecent === "NOW") {
			printedLessRecent = 0;
		}
		if (lessRecent === Infinity) {
			if (moreRecent === 0) {
				addPhrase("at any point");
			} else if (moreRecent === Infinity) {
				addPhrase("at the very beginning");
			} else {
				addPhrase("sometime up until");
				addPhrase(printedMoreRecent);
				addPhrase("turns ago");
			}
			addPhrase("[");
			addPhrase(printedMoreRecent, "moreRecent");
			addPhrase(",");
			addPhrase(printedLessRecent, "lessRecent");
			addPhrase("]");
		} else {
			addPhrase("sometime between");
			addPhrase(printedMoreRecent, "moreRecent");
			addPhrase("and");
			addPhrase(printedLessRecent, "lessRecent");
			addPhrase("turns ago");
		}
		addPhrase("", "timeOrderEnd");
	}

	// Assemble the result object. Generate the single string of text by turning our array of objects into an array of texts, then filtering any empty texts from the array, then putting a space between each element to make a string.
	var resultObj = {};
	resultObj.diagram = result;
	resultObj.text = result.map(function(r){return r.text;})
		.filter(function(n){ return n !== ""; })
		.join(" ");

	return resultObj;

};

/**
 * @method getTriggerRules
 * @memberof RuleLibrary
 *
 * @description returns an array containing all of the rules currently residing in the ruleLibrary triggerRules array.
 * TODO: Write Unit Tests for this
 *
 * @return {array} an array of rules representing the ruleLibrary's current collection of triggerRules
 */
var getTriggerRules = function(){
	if (ruleLibrary.triggerRules) {
		return util.clone(ruleLibrary.triggerRules);
	} else {
		return [];
	}
};

/**
 * @method getVolitionRules
 * @memberof RuleLibrary
 *
 * @description Returns an array containing all of the rules currently residing in the ruleLibrary volitionRules array.
 * TODO: Write Unit Tests for this
 *
 * @return {array} an array of rules representing the ruleLibrary's current collection of volitionRules
 */
var getVolitionRules= function(){
	if (ruleLibrary.volitionRules) {
		return util.clone(ruleLibrary.volitionRules);
	} else {
		return [];
	}
};

// Internal function used to both get and set rules by id: in both cases, first validates that the requested rule exists, before carrying out the relevant operation.
var _alterRule = function(label, rule) {
	var labelParts = label.split("_");
	var ruleSet = labelParts[0];
	var id = labelParts[1];

	var rl = ruleLibrary[ruleSet];
	if (rl === undefined) {
		console.log("ruleLibrary[" + ruleSet + "] was undefined.");
		return false;
	}
	var pos = ruleIndexes[ruleSet][label];
	if (pos === undefined) {
		console.log("ruleIndexes", ruleIndexes);
		console.log("ruleIndexes[" + ruleSet + "][" + id + "] was undefined.");
		return false;
	}

	if (rule === undefined) {
		// Get
		return util.clone(ruleLibrary[ruleSet][pos]);
	} else if (typeof rule === "boolean") {
		// Delete
		// ruleIndexes is a dictionary with keys for each rule id, and values of its position in the corresponding rulesLibrary array. Splicing a rule from the middle of the array would cause all the ruleIndex position numbers to be wrong. Instead, we move the last rule in the library into the position of the one we're deleting and shorten its length by one, updating the index accordingly: this lets all other positions remain unchanged.

		var lib = ruleLibrary[ruleSet];
		var ind = ruleIndexes[ruleSet];
		var posOfDyingRule = ind[label];
		var posOfFinalRule = lib.length - 1;
		var finalRuleId = lib[posOfFinalRule].id;

		// Replace the rule we're deleting with the final rule in the library.
		lib[posOfDyingRule] = lib[posOfFinalRule];
		lib.length = lib.length - 1;

		// Remove the old rule's key in the index, and update the index  for the moved rule to the position of the old.
		delete ind[label];
		ind[finalRuleId] = posOfDyingRule;

		return true;			
	} else {
		// Set
		ruleLibrary[ruleSet][pos] = util.clone(rule);
		return true;
	}
}

/**
 * @method getRuleById
 * @memberof RuleLibrary
 * @private
 * 
 * @description When given an ID in the format "ruleSetName_number", returns the rule with the corresponding ID. Rules are automatically be given a unique ID in this format when added via normal channels. Return false if no such rule can be found.
 *
 * 	@param {String} label  The ID, such as "triggerRules_14"
 * 	 
 * @return {Object}	a copy of the requested rule, or false if no such rule could be found.
 */
var getRuleById = function(label) {
	return _alterRule(label);
}

/**
 * @method setRuleById
 * @memberof RuleLibrary
 * @private
 * 
 * @description When given an ID in the format "ruleSetName_number", and a rule object, updates the rule with this ID in ensemble's internal store of loaded rules. NOTE: This is not a public-facing function, since it does no validation on the rule to be added. Instead use ensemble.setRuleById.
 *
 * 	@param {String} label  The ID, such as "triggerRules_14"
 * 	@param {Object} rule  An object representing a valid rule for the given rule set.
 *  
 * @return {Boolean}	true if the rule was successfully updated, false otherwise.
 */
var setRuleById = function(label, rule) {
	return _alterRule(label, rule);
}

/**
 * @method deleteRuleById
 * @memberof RuleLibrary
 * @private
 * 
 * @description When given an ID in the format "ruleSetName_number", deletes the rule with the corresponding ID. Rules are automatically be given a unique ID in this format when added via normal channels. Return false if no such rule can be found.
 *
 * 	@param {String} label  The ID, such as "triggerRules_14"
 * 	 
 * @return {Object}	true if the operation is successful, false otherwise.
 */
var deleteRuleById = function(label) {
	if (label === undefined) return false;
	return _alterRule(label, true);
}

var clearRuleLibrary = function() {
	ruleLibrary = {};
	ruleIndexes = {};
	triggerRules = [];
	volitionRules = [];
	util.resetIterator("rules");
}

var ruleLibraryInterface = {

	predicateToEnglish : predicateToEnglish,
	runTriggerRules : runTriggerRules,
	calculateVolition : calculateVolition,
	addRuleSet: addRuleSet,
	ruleToEnglish: ruleToEnglish,

	getTriggerRules: getTriggerRules,
	getVolitionRules: getVolitionRules,
	getRuleById: getRuleById,
	setRuleById: setRuleById,
	deleteRuleById: deleteRuleById,

	clearRuleLibrary: clearRuleLibrary
};

/* test-code */
ruleLibraryInterface.getUniqueBindings = getUniqueBindings;
ruleLibraryInterface.matchUniqueBindings = matchUniqueBindings;
ruleLibraryInterface.doBinding = doBinding;
ruleLibraryInterface.evaluateConditions = evaluateConditions;
ruleLibraryInterface.arePredicatesEqual = arePredicatesEqual;
ruleLibraryInterface.areRulesEqual = areRulesEqual;
ruleLibraryInterface.isRuleAlreadyInRuleSet = isRuleAlreadyInRuleSet;
ruleLibraryInterface.sortConditionsByOrder = sortConditionsByOrder;
/* end-test-code */

return ruleLibraryInterface;

})();
// MODULE actionLibrary
const actionLibrary = (function(){
/**
* This is the class actionLibrary
*
*
* @class  ActionLibrary
* @private
*/
var actions = []; //An array containing all of the actions available in this social world.

//Experimenting with having a 'grammar' to define the actions of the world.
var startSymbols = [];
var nonTerminals = [];
var terminalActions = [];


/**
 * @method getAllActions 
 * @private
 * @description returns an array containing every action (terminal or otherwise) available in the social world.
 * @return {Array} [An array containing every single action defined in the social world.]
 */
var getAllActions = function(){
	return actions;
};

 /**
 * @method  dumpActions
 * @description A debugging function. Dumps the whole actionLibrary object to the console, to enable reviewing all of the actions currently loaded into Ensemble.
 * @public
 @example ensemble.dumpActions();
 * @memberOf ensemble
 */
var dumpActions = function(){
	console.log("***DUMPING ACTIONS***");
	console.log("There are " + actions.length + " actions.");
	for(var i = 0; i < actions.length; i += 1){
		console.log(i + ".) " ,  actions[i]);
	}
	console.log("***END DUMPING ACTIONS***");
}

/**
 * @method getStartSymbols 
 * @private
 * @description Returns an array containing every 'start action.' Conceived to return all actions specifically tied to an intent.
 * @return {Array} [An array containing every 'root' acton (every action tied to an intent) in the social world]
 */
var getStartSymbols = function(){
	return startSymbols;
};

/**
 * @method getNonTerminals 
 * @private
 * @description Returns an array containing every 'non terminal' This will include both root and non-root actions, but exclude terminal actions.
 * @return {[type]} [An array containing every 'non terminal' action.]
 */
var getNonTerminals = function(){
	return nonTerminals;
};

/**
 * @method getTerminalActions 
 * @description Returns an array containing every terminal action.
 * @return {[type]} [An array containing every terminal action]
 */
var getTerminalActions = function(){
	return terminalActions;
};

/**
 * @methodclearActionLibrary 
 * @description Completely empties out the the action library by zero-ing out the arrays of actions, startSymbols, nonTerminals, and terminalActions. Used mainly for testing purposes.
 */
var clearActionLibrary = function(){
	actions = [];
	startSymbols = [];
	nonTerminals = [];
	terminalActions = [];
};

/**
 * @method addActions
 * @public
 * @memberOf ensemble 
 * @description Takes in either a JSON file or a JSON string representing the definition of an action or actions and stores it in the action library. This effect is cumulative; calling this function on multiple files will lead to the actions from both files being stored in the action library.
 * @param  {JSON} data - Either a JSON string or a JSON file defining an action or actions. This will typically be the output of the result of a call to loadFile().
 * @example var rawActions = ensemble.loadFile("data/actions.json"); <BR> ensemble.addActions(rawActions);
 * @return {array}      An array of every action currently stored in the action library.
 */
var parseActions = function(data){
	var parsedActions;
	var fileName;
	var actionsToCategorize = [];

	try {
		if (typeof data === "string") {
			parsedActions = (JSON.parse(data)).actions;
			fileName = (JSON.parse(data)).fileName;
		} else if (typeof data === "object") {
			parsedActions = data.actions;
			fileName = data.fileName;
		} else {
			console.log("unexpected value:", data);
			throw new Error("Error parseActions: unexpected data value: ", typeof data);
		}
	} catch (e) {
		throw new Error("JSON Error parseActions " + e);
	}
	if (parsedActions === undefined) {
		throw new Error("Error: social structure data file must be JSON that defines a top-level key 'socialStructure'");
	}
	for (var i = 0; i < parsedActions.length; i++) {
		var action = parsedActions[i];
		action.fileName = fileName;
		action.id = util.iterator("actions");
		action.origin = data.source_file;

		// Error Checking
		validate.action(action, "Examining action  #" + i);

		if(actionAlreadyExists(action)){
			console.error("Error! The action " + action.name + " is already defined!" );
			continue;
		}
		actions.push(util.clone(action));
		actionsToCategorize.push(action);
	}
	categorizeActionGrammar(actionsToCategorize);
	return actions;
};

/**
 * @method actionAlreadyExists 
 * @private
 * @description a simple helper function to see if a newly parsed in action hasn't already been defined -- this is done by looking at the name of the action. This means that even if two actions are quite different, if they share the same name an error will be printed to the console.]
 * @param  {Object} potentialNewAction [The action that has just been read in, and is to be checked against the actions already in the action library.]
 * @return {Boolean}                    [Returns true if the action already exists. False otherwise.]
 */
var actionAlreadyExists = function(potentialNewAction){
	for(var i = 0; i < actions.length; i += 1){
		if(actions[i].name === potentialNewAction.name){
			//uh oh, is already exists!
			return true;
		}
	}
};

//Checks to see if a passed in action matches an action that has already
//been categorized as a start symbol. Returns true if it does (i.e. it is a duplicate),
//false otherwise.
var startSymbolAlreadyExists = function(potentialNewAction){
	
	//One thing that we'll do is double check that there aren't two identical start symbols.
	if(potentialNewAction.intent !== undefined){
		var newStartSymbolIntent = potentialNewAction.intent;
		//alright, we're dealing with a 'start symbol' apparantly! Let's make sure it isn't a duplicate of 
		//any other start symbols that already exist!
		for(var i = 0; i < startSymbols.length; i += 1){
			var existingStartSymbol = startSymbols[i].intent;
			if(existingStartSymbol.category === newStartSymbolIntent.category &&
				existingStartSymbol.type === newStartSymbolIntent.type &&
				existingStartSymbol.intentType === newStartSymbolIntent.intentType &&
				existingStartSymbol.first === newStartSymbolIntent.first &&
				existingStartSymbol.second === newStartSymbolIntent.second){
					return true;
					//oops, they are the same! We have a problem!
					//console.log("ERROR! WE DON'T WANT TO ADD THIS TO THE LIBRARY BECAUSE IT WAS DEFINED ALREADY!");
			}
		}
	}
	return false; // they are not the same! we are okay!
}

/**
 * @method categorizeActionGrammar
 * @description This method takes in an unsorted list of actions (in the style returned from the parseActions method) and, based on the properties of these actions, determines if they are 'start', 'terminal' or 'non-terminal' actions and stores them in teh appropriate array of actionLibrary
 * @param  {[array]} actionPool [Contains an unsorted list of all of the action termainals and non terminals]
 */
var categorizeActionGrammar = function(actionPool){
	var currentAction;
	for(var i = 0; i < actionPool.length; i += 1){
		currentAction = util.clone(actionPool[i]);
		if(actionPool[i].intent !== undefined){
			if(startSymbolAlreadyExists(currentAction)){
				//we only want there to be one action per intent, i.e. each start symbol
				//should be unuqie. If that's not the case, then, er, don't push it I guess!
				console.log("ERROR! WE DON'T WANT TO ADD THIS TO THE LIBRARY BECAUSE IT WAS DEFINED ALREADY!");

			}
			else{
				startSymbols.push(currentAction);
			}

		}
		if(actionPool[i].leadsTo !== undefined){
			nonTerminals.push(currentAction); // so start terminals ALSO end up here. Maybe that's good? Can change into an else-if if not!
		}
		if(actionPool[i].effects !== undefined){
			terminalActions.push(currentAction);
		}
	}

};

/**
 * @method getSortedActionsFromVolition
 * @description Finds the actions that the initiator wants to take towards the responder, and sorts them by volition score.
 * @param  {String}  initiator          [The name of the initiator of the action]
 * @param  {String}  responder          [The name of the responder of the action]
 * @param  {Object}  registeredVolition [A registered volition object]
 * @param  {Boolean} isAccepted         [Whether or not the responder accepts the intent of the volition.]
 * @param  {Number}  weight             [How much the initiator wants to pursue this volition.]
 * @param  {[Number]}  numActionsPerGroup [Used to determine how many 'actions per group' to include. Will ultimately default to one if unspecified.]
 * @param  {Array}  cast               [The characters to use in consideration for the binding of various roles the actions might need.]
 * @return {[Array]}                     [An array of actions the initiator wants to take towards the responder, sorted by weight.]
 */
var getSortedActionsFromVolition = function(initiator, responder, registeredVolition, isAccepted, weight, numActionsPerGroup, cast){
	//console.log("Inside of getSortedactionsFromVolition");

	var actions = getActionHierarchyFromVolition(initiator, responder, registeredVolition, isAccepted, weight, numActionsPerGroup, cast);
	var sortedActions = sortActionsByVolitionScore(actions);
	return sortedActions;

};


/**
 * @method sortActionsByVolitionScore 
 * @private
 * @description Sorts an array of actions based on their weights in descending order.. Specifically, each action has a list of actions that it 'leads to' -- and it is THIS list of actions that is being sorted. Uses recursion to get to the end of the chain. Also sorts the GoodBindings of each weight as well.
 * @param  {Array} actions [An array of actions to be sorted]
 * @return {Array}         [The sorted actions]
 */
var sortActionsByVolitionScore = function(actions){
	var descSortedActions = _.sortBy(actions, "weight");
	actions = descSortedActions.reverse(); // now all of our actions are sorted, sweet!
	//Sadly, the above messes up ties, a little bit. The initial sort by screws up the order of ties, and the reverse then 'respects' the messed up order from underscore.

	//And, uh, I guess now we want to do the same as we drill downwards?
	for(var i = 0; i < actions.length; i += 1){
		var nextActions = actions[i].actions;
		if(nextActions !== undefined){
			actions[i].actions = sortActionsByVolitionScore(nextActions);
		}

		//let's try sorting the 'good bindings' by their weight$$ property.
		if(actions[i].goodBindings !== undefined){
			var descSortedBindings = _.sortBy(actions[i].goodBindings, "weight$$");
			actions[i].goodBindings = descSortedBindings.reverse();
		}
	}

	return actions;
};

/**
 * @method getActionHierarchyFromVolition
 * @description This method takes the names of the initiator and responder of an action and a registered volition 
 * between them, and will go through the entire grammar for the intnet specified in the volition and return all 
 * terminal actions that are appropriate (are of the correct accept/reject polarity, have all conditions met, etc.)
 * The number of actions returned per action group is determined by numActionsPerGroup. 
 * Cast indicates the characters to use for role binding.
 * @param  {[String]} initiator          [The name of the initiator of the action.]
 * @param  {[String]} responder          [The name of the responder of the action.]
 * @param  {[Object]} registeredVolition [The registered volition between the initiator and responder]
 * @param  {[Number]} numActionsPerGroup [The number of terminal actions to return per 'action group.' They will ultimately be sorted by salience; i.e. if this number is 1, then only the most salient terminal action per action group will be returned. If 2, the top two salient terminal actions, etc.]
 * @param  {[Array]} cast               [The characters to be used in the role binding process]
 * @return {[Array]}                    [An Array of potential actions that can be carried out from the initiator to the responder]
 */
var getActionHierarchyFromVolition = function(initiator, responder, volition, isAccepted, weight, numActionsPerGroup, cast){
	var actionIntent;
	var goodTerminals = [];
	var returnTerminalList = [];
	var potentialTerminal;
	var uniqueBindings = {};
	uniqueBindings["initiator"] = initiator;
	uniqueBindings["responder"] = responder;

	//first, we need to find the 'start' action based on the volition
	for(var i = 0; i < startSymbols.length; i += 1){
		actionIntent = startSymbols[i].intent;
		if(actionIntent.category === volition.category &&
			actionIntent.type === volition.type &&
			actionIntent.intentType === volition.intentType){
				//it appears that this is an action pertaining to this volition!
				var rootAction = util.clone(startSymbols[i]);
				rootAction.goodBindings = [];
				rootAction.goodBindings.push(uniqueBindings);
				rootAction.weight = weight; // This is the 'base' score that came from our microtheories equivalent.
				goodTerminals = getActionHierarchyFromNonTerminal(rootAction, isAccepted, numActionsPerGroup, uniqueBindings, cast);
				if(goodTerminals === undefined){ // this means we didn't find any good actions!
					console.log("found no valid actions for init: " + initiator + ", respond: " + responder + ", for volition " , volition);
					return;
				}

				returnTerminalList = goodTerminals; //Ok, so, it said temp temp temp, but actually I think this is pretty much exactly what we want!
				break;
		}
	}

	return returnTerminalList;
};


//terminalFoundInRecursiveSearch is meant to be called only when we enter the
//"terminal found" branch of getActionHierarchyFromNonTerminal. It grabs the
//relavant terminal information, including checking for new role bindings, 
//and returns it for use by getActionHierarchyFromNonTerminal.
var terminalFoundInRecursiveSearch = function(terminalAction, nonTerminal, uniqueBindings, cast, isAccepted, terminalActionParentObject){
	terminalsAtThisLevel = true;
	terminalAction.goodBindings = util.clone(nonTerminal.goodBindings);
	
	//Store this terminal's lineage so we know how to 'reach it'.
	if(nonTerminal.lineage === undefined){
		terminalAction.lineage = nonTerminal.name;
	}
	else{
		terminalAction.lineage = nonTerminal.lineage + "-" + nonTerminal.name;
	}

	//This new terminal may introduce new roles to be bound, or may impose new preconditions on existing roles.
	//In light of this, figure out what good bindings we have available and store them in the terminal.
	currentUniqueBindings = getUniqueActionBindings(terminalAction, uniqueBindings);
	var workingBindingCombinations = getWorkingBindingCombinations(terminalAction, util.clone(currentUniqueBindings), util.clone(cast), util.clone(terminalAction.goodBindings), util.clone(cast));
	terminalAction.goodBindings = workingBindingCombinations;

	//we found a terminal symbol! Great, let's add it to the list!
	//Let's do some checks to make sure that the action that we're looking at is good.
	//This means checking it's conditions, and checking if it's "isAccept" matches what we want.
	if(!actionIsAppropriate(terminalAction, isAccepted, currentUniqueBindings)){
		//oops, either the conditions or the isAccept didn't pass! Let's move along...
		//console.log("how many times do you see me? inappropriate action: " , terminalAction);
		var returnObject = {};
		returnObject.terminalsAtThisLevel = true;
		returnObject.boundTerminal = undefined;
		return returnObject;
	}

	//Let's compute influence rules for this terminal action, too!
	computeInfluenceRuleWeight(terminalAction);

	//and let's break out of here if the influence rule weight is less than 0...
	//interpreting that as the initiator doesn't actually want to do this thing...
	if(terminalAction.weight < 0){
		var returnObject = {};
		returnObject.terminalsAtThisLevel = true;
		returnObject.boundTerminal = undefined;
		return returnObject;		
	}

	if(terminalAction.salience === undefined ){
		terminalAction.salience = 0;
	}
	if(terminalAction.weight === undefined){
		terminalAction.weight = 0;
	}

	//Because salience may come back someday, use the weight as our salience.
	terminalAction.salience = terminalAction.weight + terminalAction.salience; // if there is a hard-coded sailence, honor it.

	//Return the terminal we found and other pertinent information.
	var returnObject = {};
	returnObject.terminalsAtThisLevel = true;
	returnObject.boundTerminal = terminalAction;
	return returnObject;
}

//This function is meant to be called inside of getActionHierarchyFromNonTerminal when looking at a
//"leadsTo" array of actions and finding a non-terminal. This will recursively call getActionHierarchyFromNonTerminal.
//Ultimately, we return a single action, but that action will full 'leadsTo' information all filled out based on those
//recursive calls.
var nonTerminalFoundInRecursiveSearch = function(actionName, nonTerminal, uniqueBindings, isAccepted, actionsPerGroup, cast){
	var returnList = [];

	var nonTerminalAction = getActionFromNameInArray(actionName, nonTerminals);
	nonTerminalAction.goodBindings = nonTerminal.goodBindings;
	nonTerminalAction.weight = nonTerminal.weight;

	//Figure out the 'lineage' of the action (i.e., keep track of the path we've taken down the tree.)
	if(nonTerminal.lineage === undefined){
		nonTerminalAction.lineage = nonTerminal.name;
	}
	else{
		nonTerminalAction.lineage = nonTerminal.lineage + "-" + nonTerminal.name;
	}
	
	//Get the unique bindings that still work.
	currentUniqueBindings = getUniqueActionBindings(nonTerminalAction, uniqueBindings);
	if(!actionIsAppropriate(nonTerminalAction, isAccepted, currentUniqueBindings)){
		//oops, either the conditions or the isAccept didn't pass! Let's move along...
		//console.log("how many times do you see me? inappropriate action: " , terminalAction);
		return;
	}

	//RECURSIVE CALL! Using the non-terminal we're on as the starting point for the next level down the tree.
	var diggingDeeperActions = getActionHierarchyFromNonTerminal(nonTerminalAction, isAccepted, actionsPerGroup, util.clone(currentUniqueBindings), util.clone(cast));
	if(diggingDeeperActions === undefined || diggingDeeperActions.length <= 0){
		return; // oops! This 'leads to' led to something that had no valid bindings! Better move on!
	}
	
	//Store the actions we found by 'digging deeper'
	nonTerminalAction.actions = [];
	for(var ddActionIndex = 0; ddActionIndex < diggingDeeperActions.length; ddActionIndex += 1){
		var thingToAdd = diggingDeeperActions[ddActionIndex];
		nonTerminalAction.actions.push(util.clone(thingToAdd));
	}

	//Altough this appears that we are returning a single action, it's "leads to" information should
	//be all fleshed in at this point.
	return nonTerminalAction;
}

/**
 * 
 * @method getActionHierarchyFromNonTerminal
 * @description Returns an array that represents an 'action hierarchy' i.e. each element in the array will either be a terminal, or will be a non-terminal with fully fleshed out "leads to" information that will ultimately lead to a terminal (with potentally many non terminals 'in the way' with their own leads to information.)
 * @param  {[Object]} nonTerminal [A 'non-terminal object that theoretically has a "leadsTo" field defined. This leadsTo field may lead to terminals or nonTerminals. If nonTerminals, this function is called recursively until terminals are reached.']
 * @return {[Array]}             [An Array of all of the non-terminals you can reach from the provided nonTerminal]
 */
var getActionHierarchyFromNonTerminal = function(nonTerminal, isAccepted, actionsPerGroup, uniqueBindings, cast){
	var returnList = [];
	var terminalsAtThisLevel = false;
	var currentUniqueBindings = uniqueBindings;
	var startingWeight = nonTerminal.weight;
	actionsPerGroup = actionsPerGroup || 1; //By default, assume you want the MOST salient action per group (as opposed to, say, the top TWO salient actions)
	isAccepted = typeof isAccepted !== 'undefined' ? isAccepted : true;
	if(nonTerminal.leadsTo === undefined){
		//we don't know what to do here! Uh, end of the road? Return?
		return;
	}

	//Find what the good current binding combinations are.
	currentUniqueBindings = getUniqueActionBindings(nonTerminal, uniqueBindings);
	var nonTerminalWorkingBindingCombinations = getWorkingBindingCombinations(nonTerminal, util.clone(uniqueBindings), util.clone(cast), util.clone(nonTerminal.goodBindings), cast);
	if(nonTerminalWorkingBindingCombinations.length <= 0){
		//Oops, there is no possible combination of cast members that make this work! 
		//So no point in going down this path anymore!
		return;
	}

	//Store the bindings that we know 'work' (i.e. there exist characters that satisfy the preconditions)
	//inside of our nonTerminal action.
	nonTerminal.goodBindings = nonTerminalWorkingBindingCombinations;

	//So, now at this point, where I have all of the 'good bindings' at this level... I guess what I want to do
	//is go through all of the influence rules, for each binding, and re-score them?
	//The starting score should come from the 'parent' element.
	//oh, wait, it has it already I think, because we don't have any children yet. OK.
	computeInfluenceRuleWeight(nonTerminal);

	//Used to help us have a nice 'wrapper' action object, for keeping track of the 
	//heritage of an action as we ultimately drill down to find the terminals.
	var terminalActionParentObject = {};
	terminalActionParentObject.name = nonTerminal.name;
	terminalActionParentObject.weight = nonTerminal.weight;
	terminalActionParentObject.goodBindings = nonTerminal.goodBindings;
	terminalActionParentObject.actions = [];
	var potentialActionsToReturn = [];
	
	//The big for-loop! We'll loop through each action in the 'leads to' list, and do 
	//something different depending on if it is a terminal action or a non terminal actions.
	for(var i = 0; i < nonTerminal.leadsTo.length; i += 1){
		var actionName = nonTerminal.leadsTo[i];

		//optimistically check to see if the first action we are looping through is a terminal.
		var terminalAction = getActionFromNameInArray(actionName, terminalActions);

		//Check to see if the action in the "leads to" leads to a terminal.
		if(terminalAction !== undefined){
			//Great, we found a terminal! Let's grab the important information from it!

			var response = terminalFoundInRecursiveSearch(terminalAction, nonTerminal, uniqueBindings, cast, isAccepted, terminalActionParentObject);
			terminalsAtThisLevel = response.terminalsAtThisLevel;
			var foundTerminal = response.boundTerminal;
			
			//Now, just because we found a terminal doesn't mean that it is a 'good' terminal
			//for example, we may have found an 'accept' terminal but we are looking for a 
			//reject terminal.
			if(foundTerminal !== undefined){
				//Alright, this is, in fact, a terminal that we are planning on keeping (at least for now!)

				//We want to add this terminal to a running list of terminals we've found at this level
				//in the hiearchy, and sort the list based on salience.
				//Salience itself isn't particularly used right now, and instead the 'weight' computed
				//from influence rules is essentially used to represent salience.
				terminalActionParentObject.actions.push(foundTerminal);
				var sortedActionsBySalienceAscending = _.sortBy(terminalActionParentObject.actions, "salience");
				var sortedActionsBySalienceDescending = sortedActionsBySalienceAscending.reverse();
				terminalActionParentObject.actions = sortedActionsBySalienceDescending;
	
				//The user may have selected a finite amount of actions per 'action group'
				//This is where that cut off happens. Cut off the least salient actions if we have
				//more actions than the actionsPerGroup allows.
				if(terminalActionParentObject.actions.length > actionsPerGroup){
					terminalActionParentObject.actions.splice(actionsPerGroup, terminalActionParentObject.actions.length - actionsPerGroup);
				}
			}
		}
		else{ // Ah, we must be dealing with another non-terminal! let's DIG DEEPER!
			
			//We know that we're looking at a non-terminal. It will probably lead to other actions.
			//We'll ultimately use the poewr of recursion to help us get there!
			var nonTerminalWithNewRoles = nonTerminalFoundInRecursiveSearch(actionName, nonTerminal, uniqueBindings, isAccepted, actionsPerGroup, cast);
			if(nonTerminalWithNewRoles !== undefined){ // there's a chance we might get an undefined thing (like if the preconditions to the non-terminal don't hold). Don't add it if it is undefined!
				returnList.push(nonTerminalWithNewRoles);
			}
		}

	}

	//Because there might be non-terminals and terminals at the same level, do a check 
	//to see if we need to add anything in at this level in the tree.
	if(terminalsAtThisLevel === true){
		for(var terminalsToPushUpIndex = 0; terminalsToPushUpIndex < terminalActionParentObject.actions.length; terminalsToPushUpIndex += 1){
			returnList.push(util.clone(terminalActionParentObject.actions[terminalsToPushUpIndex]));
		}
	}

	//If we've gotten here, we must have gotten everything we need!
	return returnList;

};

/**
 * @method computeActionsSalience
 * @description Takes an action as a parameter. If it's salience score is undefined, computes a new salience score based on it's conditions.
 * @param  {[Object]} terminalAction [An action that should come at the 'end' of the action tree (i.e. it should have effects associated with it). This actions conditions are used to compute salience.]
 * @return {[Number]}                [The number representing the salience of this particular action.]
 */
var computeActionSalience = function(terminalAction){
	var returnValue;
	var multiplier = 5; // Maybe this should live in some constants thing? Or, better yet, be something that the user can specify?
	if(terminalAction.salience !== undefined){
		returnValue = terminalAction.salience;
	}
	else{
		var numConditions = terminalAction.conditions.length;
		if(numConditions === undefined){
			numConditions = 0;
		}
		var salienceCalculation = numConditions * multiplier;
		returnValue = salienceCalculation;
	}
	return returnValue;
};

//MYU OLD INFLUENCE RULE CODE, but separated out (because I think other things were calling it!)
//Going to change all instances of 'nonTerminal' to 'action', because I think any action can actually
//be passed through this now.
/**
 * @method computeInfluenceRuleWeight 
 * @private
 * @description Takes in an action, goes through all of its valid bindings, and evaluates the influence rule for each set of bindings. Stores the weight with each binding and, for the best weight (i.e. the best binding) stores it at the level of the action.
 * @param  {Object} action [The action to compute the weight for. Should have at least one 'goodBinding' attached to it]
 */
var computeInfluenceRuleWeight = function(action){
	var bestWeightFoundSoFar = -999999;
	for(var goodBindingIndex = 0; goodBindingIndex < action.goodBindings.length; goodBindingIndex += 1){
		var tempGoodBindings = action.goodBindings[goodBindingIndex];
		//var oldWeight = findWeightFromPreviousBinding(tempGoodBindings, oldGoodBindings);
		var oldWeight = tempGoodBindings.weight$$;
		if(oldWeight === undefined){
			//This should only happen at the 'top level' I think.
			oldWeight = action.weight; // This should be equal to the 'starting volition'
		}
		var scoreFromInfluenceRules = evaluateActionInfluenceRules(action, tempGoodBindings);
		//console.log("Getting here! Here is score from influence rules! " , scoreFromInfluenceRules);
		//I'm starting to get a little doubtful that this is going to work. Oh, unless... unless the score LIVEs inside of the good bindings?
		//Sure, the score can live there, but the 'BEST' score should also live at the level of the influence rule itself... yah?
		//AND DON'T FORGET! The score is adjusted by what has come before it, too!
		//var candidateWeight = startingWeight + scoreFromInfluenceRules;
		var candidateWeight = oldWeight + scoreFromInfluenceRules;
		if(candidateWeight > bestWeightFoundSoFar){
			//We've found a new best candidate!
			action.weight = candidateWeight;
			bestWeightFoundSoFar = candidateWeight;
		}

		action.goodBindings[goodBindingIndex].weight$$ = candidateWeight;
		
	}
};

/**
 * @method actionIsAppropriate
 * @description actionIsAppropriate checks various qualities that would make an action "not appropriate", such as an action being marked as an "accept" action when we are looking for a reject action.
 * @param  {[Object]}  action         [The method uses properties of this action, such as isAccept and goodBindings, to confirm if the action is still appropriate.]
 * @param  {Boolean} isAccepted     [A boolean representing the type of action we are looking for -- true for an accept action, false for a reject action.]
 * @param  {[Object]}  uniqueBindings [All of the unique roles that have been defined for the action tree.]
 * @return {[Boolean]}                 [Returns true if the action is still appropriate, false otherwise. Returning false here halts continuation down the action tree, as this being false means all subsequent actions will also be false.]
 */
var actionIsAppropriate = function(action, isAccepted, uniqueBindings){
	
	if(action.isActive === false) {
		return false;
	}
	
	if(action.isAccept !== undefined){
		if(isAccepted !== action.isAccept){
			return false; // oops, looking for one truth value but found another!
		}
	}

	//If actions don't have an isAccept defined, assume that they are an isAccept of true.
	//This only works with TERMINAL ACTIONS.
	//TODO: Come up with a more robust means of teting for terminal actions than looking at existance of leadsTo and effects
	if(action.isAccept === undefined && action.leadsTo === undefined && action.effects !== undefined){
		if(isAccepted === false){
			return false; // oops, if undefined we assume true, but we are looking for false!
		}
	}


	//If we get to this point, and the action has no "goodBindings" associated with it,
	//that means that there is no combination of characters that exists that satisfies all 
	//of the conditions that have been specified by this point in the "action tree." Therefore,
	//there is no point in going further.
	if(action.goodBindings.length <= 0){
		return false; // if there are no good bindings here, the action is not appropriate?
	}
	return true;
};


/**
 * @method getActionFromNameInArray
 * @private
 * @description Given the name of an action, searches through a provided array to find the corresponding action object and returns it.
 * @param  {string} actionName [The name of the action we are hunting for in the provided array.]
 * @return {object}            [An object representing all relevant information pertaining to the requested action. Returns undefined if no such action exists.]
 */
var getActionFromNameInArray = function(actionName, actionArray){
	for(var i = 0; i < actionArray.length; i += 1){
		if(actionArray[i].name === actionName){
			return util.clone(actionArray[i]);
		}
	}
	return undefined;
};

/**
 * @method getActionFromName
 * @private
 * @description Given the name of an action, searches through the action array to find the corresponding action object and returns it.
 * @param  {string} actionName [The name of the action we are hunting for in the actions array.]
 * @return {object}            [An object representing all relevant information pertaining to the requested action. Returns undefined if no such action exists.]
 */
var getActionFromName = function(actionName){
	for(var i = 0; i < actions.length; i += 1){
		if(actions[i].name === actionName){
			return util.clone(actions[i]);
		}
	}
	return undefined;
};

//Given an action and a set of bindings to use, goes through all of the roles in the action and
//replaces them with character names
var bindActionEffects = function(actionObject, bindingsToUse){
	for(var i = 0; i < actionObject.effects.length; i += 1){
		actionObject.effects[i].first = bindingsToUse[actionObject.effects[i].first];
		actionObject.effects[i].second = bindingsToUse[actionObject.effects[i].second];
	}
	return actionObject;
};

/**
 * @method getUniqueActionBindings
 * @description Given an action (actionObject) and an object representing all of the unique roles we've encountered thus far (uniqueBindings), go through the roles specified in the action and, if not already present in the uniqueBindings object, add them to it!
 * @param  {[Object]} actionObject   [An action object. This method goes through it's first and second roles of each of it's conditions, and adds any new roles it finds to the unique bindings object]
 * @param  {[Object]} uniqueBindings [An object representing all of the unique roles found by this point in the action chain. If undefined, this method will create a new one.]
 * @return {[Object]}                [An object containing all of the unique roles used by this point in the action chain.]
 */
var getUniqueActionBindings = function(actionObject, uniqueBindings){

	//Go through all of the conditions and check them for new roles
	var conditions = actionObject.conditions;
	for (var i = 0 ; i < conditions.length ; i += 1) {
		var predicate = conditions[i];			//store the current condition in a temp

		//if the dictionary does not have an entry for the current predicate's first, initialize it
		if (uniqueBindings[predicate.first] === undefined) {
			uniqueBindings[predicate.first] = "";		//possible optimization to change the initialization to zero
		}
		//and the same for the second entry in there is a second character in the predicate
		if (predicate.second !== undefined) {
			if (uniqueBindings[predicate.second] === undefined) {
				uniqueBindings[predicate.second] = "";
			}
		}
	}

	return uniqueBindings;
};

/**
* @method getWorkingBindingCombinations
* @description This method figures out potential combinations of characters that will satisfy all of the conditions
* that have been specified by this point in the action tree. Actions passed into the function through the 'action' parameter
* are assumed to have a field called "goodBindings" that represent working combinations of characters to roles found through 
* previous calls to this function. These good bindings will be updated in this function as new roles are discovered (e.g a new role 
* that appeared later on down the action tree). Additionally, as new conditions are found, old combinations of bindings that
* used to work may no longer work; this function will accomadate that as well. This method uses recursion.
* @param  {[Object]} action               [The action we are finding valid combinations of bindings for. Assumes it has both a conditions array and a goodBindings array.]
* @param  {[Object]} uniqueBindings       [A list of the roles that need to be filled. Some roles, such as initiator and responder, should be pre-populated with the initiator and responder of the action.]
* @param  {[Array} availableCastMembers [The cast members to use in filling in roles. As a character can only fulfill one role at a time, characters are 'removed' from the cast once they are assigned a role.]
* @param  {[Array]} combinationsToUse    [Although the action parameter will have all of the potential combinations, due to the recursive nature of this function, it is important to specify which set of combinations we want to use. In general, when this function is called non-recursively, this parameter should include all of the 'goodBindings' found in the action. When called recursively, you shoudl only pass in a single binding at a time.s]
* @return {[Array]}                      [An array of all valid character-role combinations for the given action]
*/
var getWorkingBindingCombinations = function(action, uniqueBindings, availableCastMembers, combinationsToUse, allCastMembers){
	var returnArray = [];
	var newCombinationsToUse = [];


	//We want to do the following for each of our existing 'good' Combinations.
	//NOTE: This should only be > 1 when called from the outside. When called recursively, combinationsToUse should only consist of a single combination.	
	for(var workingCombinationIndex = 0; workingCombinationIndex < combinationsToUse.length; workingCombinationIndex += 1){
	
		newCombinationsToUse = []; // kinda weird, but we want to zero it out each time, because we only ever want it to have one entry.
		newCombinationsToUse.push(util.clone(combinationsToUse[workingCombinationIndex]));
		availableCastMembers = util.clone(allCastMembers);

		//I feel like we need to do something here to re-populate availableCastMembers with 
		//the people previously spliced out from the previous uniqueBindings?
		
		//We want to start off by filling in the roles stored in 'uniqueBindings' with the roles
		//that we've found that work from the previous combinations discovered.
		for (var role in combinationsToUse[workingCombinationIndex]){
			var characterName = combinationsToUse[workingCombinationIndex][role];
			if( characterName !== ""){
				//a character has been specified to work in this role (could be initiator, responder, or something else)
				//remove them from the available cast members, but make sure that they are 'lodged' in the unique bindings.
				//We remove them from the available cast members, because it means this character should be unavailable for any other role.
				if(availableCastMembers !== undefined){
					var castIndex = availableCastMembers.indexOf(characterName);
					if(castIndex >= 0){
						availableCastMembers.splice(castIndex, 1);
					}
				}

				//And just as the initiator and responder roles have already been clearly defined earlier,
				//inside of uniqueBidings, let's do the same for this new role...
				uniqueBindings[role] = characterName;
			}
		}

		//Used to help us find out if there are any roles that still need to be specified
		//Even though we just went through previous combinations to fill in roles, there could
		//still be some unspecified if this new action has introduced NEW roles.
		var isFilled = true;
		var emptyKey = "";

		//find an unbound key in the uniqueBindings dictionary
		for (var key in uniqueBindings) {
			if (uniqueBindings[key] === "") {
				emptyKey = key;
				isFilled = false;
				break;
			}
		}

		//All of the roles are filled. We can check to see if the conditions of this action
		//evaluate to true with this particular combination of roles and characters.
		if(isFilled === true){

			//Replace placeholder variables in conditions with actual character names.
			var boundConditions = ruleLibrary.doBinding(uniqueBindings, util.clone(action.conditions));

			//Find out if the conditions are true with this particular set of characters in these roles.
			var evaluationResult = ruleLibrary.evaluateConditions(boundConditions);

			if(evaluationResult === true){
				//Awesome! It's true! Push it on to our return array for later!
				returnArray.push(util.clone(uniqueBindings));
			}
			else{
				//console.log("FAILURE FAILURE. not even going to bother printing the combination.");
			}
		}
		else{ // uniqueBindings is not totally filled in yet.
			//time to recurse.
			for(var i = 0; i < availableCastMembers.length; i += 1){
				uniqueBindings[emptyKey] = availableCastMembers[i];	// place an available cast member into the empty slot in the dictionary
				var updatedCastMembers = util.clone(availableCastMembers);
				updatedCastMembers.splice(i, 1);	// the updated cast has the currently assigned member removed for the recursion
				var potentialCombinations = getWorkingBindingCombinations(action, uniqueBindings, updatedCastMembers, newCombinationsToUse, allCastMembers);
				
				//Depending on where we are in the recursion chain, there's a chance that potentialCombinations
				//might have a length > 1. At least I think that's the case. If not, better safe than sorry, yeah?
				for(var k = 0; k < potentialCombinations.length; k += 1){
					returnArray.push(util.clone(potentialCombinations[k]));
				}
			}
			//If we've gotten here, we want to 'clear out' the uniqueBindings slot of the current 'emptyKey'
			//Because we want it to be clear for when we pop back up to the previous level of recursion.
			uniqueBindings[emptyKey] = "";
		}
	}
	return returnArray;
};

/**
 * @method bindActionCondition 
 * @description Takes in an array of conditions and a specific binding to use, and replaces all 'generic roles' in the conditions (e.g., "x", "y", "cheater", etc.) with actual character names.
 * @param  {Array} conditions   [An Array of conditions filled with generic roles (such a initiator, x, or cheater)]
 * @param  {[Object]} bindingToUse [A dictionary of sorts mapping which charactes should be used to fill in which roles]
 * @return {[Array]}              [An array of the same conditions passed in, but with their generic roles filled in with character names.]
 */
var bindActionCondition = function(conditions, bindingToUse){
	for(var i = 0; i < conditions.length; i += 1){
		if(conditions[i].first !== undefined){
			conditions[i].first = bindingToUse[conditions[i].first];
		}
		if(conditions[i].second !== undefined){
			conditions[i].second = bindingToUse[conditions[i].second];
		}
	}
	return conditions;
};


//Given a binding, goes througha all of the influence rules of an action
//and keeps a running sum of their effects. Then returns that sum.
/**
 * @method evaluateActionInfluenceRules 
 * @description Given a binding, goes through all of the influence rules of an action and keeps a rnning sum of their effects, then returns that sum.
 * @param  {[Object]} action       [An action, with specified influence rules]
 * @param  {[Object]} bindingToUse [A specfication of the characters to use to fill in each role in the action's influence rules]
 * @return {[Number]}              [The sum of the influence rules for this action given this binding.]
 */
var evaluateActionInfluenceRules = function(action, bindingToUse){
	var volitionSum = 0;

	for(var i = 0; i < action.influenceRules.length; i += 1){
		var rule = action.influenceRules[i];
		var boundConditions = bindActionCondition(util.clone(rule.conditions), bindingToUse);
		var isRuleTrue = ruleLibrary.evaluateConditions(boundConditions);
		if(isRuleTrue === true){
			volitionSum += rule.weight;
		}

	}
	return volitionSum;
};

//Returns the 'best' terminal based on an actionList (where an actionList is presumambly)
//a list of potential actions that has been computed given a certain cast. Everything should
//already be sorted already, so it's just an easy matter of finding the 'first' thing in every
//action list until we find one with no other actions -- then that means that we're at the 
//best terminal!
/**
 * @method getBestTerminalFromActionList 
 * @description Returns the 'best' terminal from an actionList, where best is defined to be the terminal with the highest weight. This function assumes the actionList has already been sorted.
 * @param  {[Array]} actionList [An array of actions. Each of these actions itself contains another array of actions. All of these arrays within arrays, however, should be sorted already before calling this function.]
 * @return {[Object]}            [The best (highest weighted) terminal action, with it's roles filled in with the best binding of characters]
 */
var getBestTerminalFromActionList = function(actionList){
	//console.log("inside of getTerminalsFromActionList");
	if(actionList.length <= 0){
		//we shouldn't be getting in here with an empty actionList!
		return undefined;
	}
	if(actionList[0].actions !== undefined && actionList[0].actions.length > 0){
		//we are not at a terminal! Keep digging deeper!
		//And because we are only concerned with THE BEST, and the actionList should already be sorted,
		//it should just be a matter of looking at the first entry; no need to look at the rest of the list.
		return getBestTerminalFromActionList(actionList[0].actions);
	}
	else{
		//Ok, we're at the best terminal!
		var terminal = actionList[0];

		//BUT -- we need to get the 'best binding!'
		//There might be multiple best bindings!
		var potentialBestBindings = [];
		for(var i = 0; i < terminal.goodBindings.length; i += 1){
			//See if this goodBinding is in the running for being a bestBinding!
			if(terminal.goodBindings[i].weight$$ === terminal.weight){
				potentialBestBindings.push(terminal.goodBindings[i]);
			}
		}

		//Ok, pick one of the potentialBestBindings at random!
		var goodBindingIndex = _.random(0, potentialBestBindings.length-1);
		var bindingsToUse = potentialBestBindings[goodBindingIndex];
		//and NOW what we want to do is 'fill in' the action with this good binding!
		return bindActionEffects(terminal, bindingsToUse);
	}
};

//Given a volition object, returns the single 'best' action for that volition,
//using the best binding. if multiple best bindings exist, just picks one at random.
/**
 * @method getAction 
 * @memberOf ensemble
 * @public
 * @description ensemble Interface function. Given a volition object, returns the single 'best' action for that volition using the best binding. If multiple best bindings exist, it will pick one at random.
 * @param  {[String]} initiator          [The name of the character initiating the action]
 * @param  {[String]} responder          [The name of the 'recipient of the action']
 * @param  {[Object]} volition           [A registered volition object]
 * @param  {[Array]} cast               [The cast of characters to be used for consideration of the filling in of roles.]
 * @param  {[Number]} numActionsPerGroup [How many terminals from a single 'actionGroup' should be returned. Defaults to 1 if unspecified.]
 * @example var bestActionFromBobToJane = ensemble.getAction("bob", "jane", volitionObject, cast);
 * @return {[Object]}                    [Returns the best, bound action for this particular initiator, responder, and cast.]
 */
var getAction = function(initiator, responder, volition, cast, numActionsPerGroup){
	console.log("inside getAction");
	//console.log("This is the contents of the actionLibrary: " , actionLibrary);
	if(numActionsPerGroup === undefined){
		numActionsPerGroup = 1;
	}

	var actionList;
	var volitionInstance = volition.getFirst(initiator, responder);
	while((actionList === undefined || actionList.length === 0) && volitionInstance !== undefined){
		var acceptedObject = volition.isAccepted(initiator, responder, volitionInstance);
		var isAccepted = acceptedObject.accepted;
		var weight = volitionInstance.weight;
		actionList = getSortedActionsFromVolition(initiator, responder, volitionInstance, isAccepted, weight, numActionsPerGroup, cast);
		volitionInstance = volition.getNext(initiator, responder);
	}
	var boundAction = getBestTerminalFromActionList(actionList);
	return boundAction;
};

/**
 * @method getActions 
 * @memberOf ensemble
 * @public
 * @description Similar to getAction, but allows the user to specify the number of intents to draw from, and the number of actions that shold come from each intent.
 * @param  {String} initiator - The name of the character initiating the action
 * @param  {String} responder - The name of the recipient of the action
 * @param  {Object} volition - The registered volition object.
 * @param  {Array} cast - The pool of characters to be used for consideration for the filling in of roles.
 * @param  {Number} numIntents - The total number of different intents to pull actions from.
 * @param  {Number} numActionsPerIntent - How many actions should come from each intent.
 * @param  {Number} numActionsPerGroup - How many terminals should come from any given 'action group'
 * @example var cast = ["bob", "carol", "xander"];
var calculatedVolitions = ensemble.calculateVolitions(cast);
var bobToCarolActions = ensemble.getActions("bob", "carol", calculatedVolitions, cast, 1, 1, 1)
 * @return {Array} A list of terminals, with roles bound with characters, that represent what the initiator most wants to do with the responder.
 */
var getActions = function(initiator, responder, volition, cast, numIntents, numActionsPerIntent, numActionsPerGroup){
	//console.log("inside of getActions!");
	if(numActionsPerGroup === undefined) numActionsPerGroup = 1;

	var returnList = [];
	var actionList;
	var volitionInstance = volition.getFirst(initiator, responder);
	if(volitionInstance === undefined){
		//This means that this initiator has NO volitions towards this responder. Abort!
		var emptyList = [];
		return emptyList;
	}
	var intentsRepresented = 0;
	var numActionsFromThisIntent = 0;
	var thisIntentCountedYet = false;
	while(intentsRepresented < numIntents){
		thisIntentCountedYet = false;
		numActionsFromThisIntent = 0;
		var acceptedObject = volition.isAccepted(initiator, responder, volitionInstance);
		var isAccepted = acceptedObject.accepted;
		var weight = volitionInstance.weight;

		//This is a matter of philosophy that we may want to revisit someday.
		//Currently determines "numActionsPerIntent" things based on the 'high level structures' but can potentially lead to
		//LOTS of terminals.
		//might be more intuitive to only return the specified number of terminals.
		//i.e. The Question: is 'numActionsFromThisIntent' referring to terminals, or higher level structures?
		//Current Answer: higher level structures.
		actionList = getSortedActionsFromVolition(initiator, responder, volitionInstance, isAccepted, weight, numActionsPerGroup, cast);

		for(var i = 0; i < actionList.length; i += 1){
			returnList.push(util.clone(actionList[i]));
			//console.log("What does returnList look like at this point...? ", returnList);
			if(thisIntentCountedYet === false){
				intentsRepresented += 1;
				thisIntentCountedYet = true;
			}

			//console.log("num actions we are actually adding... " , numActionsWeAreActuallyAdding);

			//We've found an action from this intent, and have already added it to the return list.
			numActionsFromThisIntent += 1;
			if(numActionsFromThisIntent === numActionsPerIntent){
				//We've reached our quota for this intent--let's move on to the next intent, even if there are more actions left that could be added.
				break;
			}
		}
		volitionInstance = volition.getNext(initiator, responder);
		if(volitionInstance === undefined){
			break;
		}
	}


	//is grabAllTerminals needed here? Maybe not, since getSortedActionsFromVolition appears to only return terminals itself?
	var allTerminals = grabAllTerminals(returnList);
	var boundActions = sortAndBindTerminals(allTerminals);
	//var boundActions = extractAndSortTerminalsFromActionList(returnList);
	return boundActions;
};

/**
 * @method setActionById 
 * @memberOf ensemble
 * @private
 * @description Meant to be used by the authoring tool, if ever actions need to be stored by a special id.
 * @return {Boolean} Returns true on successfully setting an action, false otherwise.
 */
var setActionById = function(id, newAction) {
	for (var i = 0; i < actions.length; i++) {
		var action = actions[i];
		if (action.id === id) {
			actions[i] = newAction;
			return true;
		}
	}
	return false;	
}

//for each action in the action list, go through and find how many total terminal actions we have.
var getNumberOfTerminalsReachablebyAnActionList = function(actionList){	
	var sum = 0;
	for(var i = 0; i < actionList.length; i += 1){
		sum += getNumberOfTerminalsReachablebyAnAction(actionList[i]);
	}
	return sum;
}

//action could be either a terminal or a non terminal!
//we'll be calling this recursively!
var getNumberOfTerminalsReachablebyAnAction = function(action){
	var sum = 0;
	if(action.leadsTo === undefined){
		//we are dealing with a terminal! return one!
		return 1;
	}
	else{
		for(var i = 0; i < action.leadsTo.length; i += 1){
			sum += getNumberOfTerminalsReachablebyAnAction(action.leadsTo[i]);
		}
		return sum;
	}
}

//This function takes an action list. That is, an array (or something) of actions.
//Some of these actions are terminals. They should be grabbed!
//However, some of these are, in fact, not terminals, but might LEAD to other
//terminals. This function will also drill down into those non-terminals, and get
//the terminals that are buried within.
var grabAllTerminals = function(actionList){
	var terminalsFoundHere = [];
	var terminalsFoundDeeper;
	var deeperTerminalRecord;
	for(var i =0; i < actionList.length; i += 1){
		if(actionList[i].actions !== undefined){
			//Drill down further.
			terminalsFoundDeeper = grabAllTerminals(actionList[i].actions);
			if(terminalsFoundDeeper !== undefined){
				if(deeperTerminalRecord === undefined){
					deeperTerminalRecord = terminalsFoundDeeper;
				}
				else{
					deeperTerminalRecord = deeperTerminalRecord.concat(terminalsFoundDeeper);
				}
				//clear out our 'terminals found deeper' array
				terminalsFoundDeeper = [];
			}
		}
		else{
			//end of the road, actionList[i] is a terminal.
			terminalsFoundHere.push(actionList[i]);
		}
	}
	var allTerminals;
	if(deeperTerminalRecord !== undefined){
		allTerminals = terminalsFoundHere.concat(deeperTerminalRecord);
	}
	else{
		allTerminals = terminalsFoundHere;
	}
	return allTerminals;
};

//sortAndBindTerminals expects that a 'list' of actions be passed in
//and that eeach of these actions should be terminals.
//This function sorts them based on their volition score, finds the
//best binding for them, and then updates the sorted array based on those bindings.
//It returns an array of terminals which have been sorted and who have good bindings.
var sortAndBindTerminals = function(terminalArray){
	var sortedTerminals = sortActionsByVolitionScore(terminalArray);
	for(var k = 0; k < sortedTerminals.length; k += 1){
		var bestBindings = getBestBindingFromTerminal(sortedTerminals[k]);
		sortedTerminals[k] = bindActionEffects(sortedTerminals[k], bestBindings);
	}
	return sortedTerminals;
};

/**
 * @method getBestBindingFromTerminal 
 * @description Given a terminal action, looks at it's list of good bindings and finds the one that matches the score of the action itself. If multiple ones do, picks one at random.
 * @param  {[Object]} terminal [An Action]
 * @return {[Object]}          [An object representing which bindings are the best ones to use for this action]
 */
var getBestBindingFromTerminal = function(terminal){
	//There might be multiple best bindings!
	var potentialBestBindings = [];
	for(var i = 0; i < terminal.goodBindings.length; i += 1){
		//See if this goodBinding is in the running for being a bestBinding!
		if(terminal.goodBindings[i].weight$$ === terminal.weight){
			potentialBestBindings.push(terminal.goodBindings[i]);
		}
	}

	//Ok, pick one of the potentialBestBindings at random!
	var goodBindingIndex = _.random(0, potentialBestBindings.length-1);
	var bindingsToUse = potentialBestBindings[goodBindingIndex];
	return bindingsToUse;
};


var actionLibraryInterface = {
	parseActions : parseActions,
	getAllActions : getAllActions,
	getActionFromName : getActionFromName,
	bindActionEffects : bindActionEffects,
	categorizeActionGrammar : categorizeActionGrammar,
	getStartSymbols : getStartSymbols,
	getNonTerminals : getNonTerminals,
	getTerminalActions : getTerminalActions,
	getActionHierarchyFromNonTerminal : getActionHierarchyFromNonTerminal,
	clearActionLibrary : clearActionLibrary,
	getActionHierarchyFromVolition : getActionHierarchyFromVolition,
	getSortedActionsFromVolition : getSortedActionsFromVolition,
	getBestTerminalFromActionList : getBestTerminalFromActionList,

	getAction : getAction,
	getActions : getActions,
	setActionById: setActionById,

	dumpActions : dumpActions
};



/* test-code */
//actionLibraryInterface.bindActionEffects = bindActionEffects;
actionLibraryInterface.getWorkingBindingCombinations = getWorkingBindingCombinations;
actionLibraryInterface.startSymbolAlreadyExists = startSymbolAlreadyExists;
/* end-test-code */

return actionLibraryInterface;

})();
// MODULE volition
const volition = (function(){
/*global console, define */
/*jshint sub:true*/
/*
* This is the class Volition, for caching and accessing calculated volitions for characters in ensemble, using an Iterator pattern.
*
* Basic usage of this module: store a calculated volition using the saveVolitions function
*
* The internal format for a volitions objects should be structured like this:
* 		{
		"Simon": {
			"Monica": [
				{ "category": "network", "type": "buddy", "intentType": true, "weight": 20 },
				{ "category": "relationship", "type": "involved with", "intentType": true, "weight": 19 }
			]
		},
		"Monica": {
			"Simon": [
				{ "category": "network", "type": "romance", "intentType": false, "weight": 12 }
			]
		}
	}
*
* Public methods are:
*
* calculateVolition
* runTriggerRules
*
* @class volition
* @private
*/
var volitionCache = {};
var cachePositions = {};

/**
 * Get the highest-weighted volition in a given set, for a particular pair of characters, or return undefined if no such volition can be found.
 *
 * @param  {String} key    The identifier for a volition set.
 * @param  {String} from   Identifier for the "from" character.
 * @param  {String} to     Identifier for the "to" character.
 *
 * @return {Object}        A volition predicate, with keys "category", "network", "type", "intentType", and "weight". (Or undefined if there are no volotions for this pair of characters.)
 */
var getFirstVolition = function(key, from, to) {

	// Check that we have volitions to return.
	var vSet = volitionCache[key];
	if (vSet === undefined) {
		console.log("No matching volition set found with key '" + key + "'.");
		return undefined;
	}
	if (vSet[from] === undefined || vSet[from][to] === undefined) {
		console.log("No matching volitions found in set '" + key + "' from '" + from + "' to '" + to + "'.");
		return undefined;
	}

	// Set the cache position for this pair of characters to 0.
	var cachePositionsKey = key + from + to;
	cachePositions[cachePositionsKey] = 0;

	// Return the volition at the first position (highest weighted).
	return vSet[from][to][0];

};

/**
 * Get the next-highest-weighted volition in a given set, for a particular pair of characters, or return undefined if no such volition can be found. If this function on a set for the first time, it acts the same as getFirstVolition. Note that iteration is by a particular pair of characters; calling the function for a different pair of characters will start at getFirst for that pair.
 *
 * @param  {String} key    The identifier for a volition set.
 * @param  {String} from   Identifier for the "from" character.
 * @param  {String} to     Identifier for the "to" character.
 * 
 * TODO: It would be nice to have functionality to get a specified intent (e.g. 'what is the volition for Simon to startDating Monica?')
 *
 * @return {Object}        A volition predicate, with keys "category", "network", "type", "intentType", and "weight". (Or undefined if there are no more volitions for this pair of characters.)
 */
var getNextVolition = function(key, from, to) {

	var cachePositionsKey = key + from + to;
	var vSet = volitionCache[key];
	var pos = cachePositions[cachePositionsKey];

	// If we have no cached position, act like getFirstVolition.
	if (pos === undefined) {
		return getFirstVolition(key, from, to);
	}

	// If we are out of volitions, return undefined
	if (vSet[from][to][pos+1] === undefined) {
		return undefined;
	}

	// Advance the cache position and return the next volition.
	cachePositions[cachePositionsKey] += 1;
	pos = cachePositions[cachePositionsKey];
	return vSet[from][to][pos];

};

/** Given a set of pre-computed volitions, returns an object with a boolean and an array of reasons why (i.e. b/c their weight is >= 0).
 * 
 * @method isAccepted
 * @memberof Volition
 * @param {String}	key 	The string that serves as an index to look up volitions in the volitionCache
 * @param {String}	initiator	The first person in the predicate attempted the intent predicate
 * @param {String}	responder	The second person in the predicate
 * @param {Object}	predicate	Predicate intent object to try to match from the predicate intents in the volitionCache 
 * @return {Object}	returnObject	an object with the keys:
 * 									{Boolean} accepted - whether the intent is accepted
 * 									{Array} reasonsWhy - the array of volition predicates that are the reason(s) something was accepted
 */
var isAccepted = function(key, initiator, responder, predicate) {
	var acceptIfNoMatch = true; // If no matching rules affect the decision, should the character accept or reject the game?
	var minimumWeightForAccept = 0;
	
	var returnObject = {};		
	returnObject.accepted = acceptIfNoMatch;
	returnObject.reasonsWhy = [];
		
	var thisV = getFirstVolition(key, responder, initiator);
	while (thisV !== undefined) {
		if (thisV["category"] === predicate["category"] &&
			thisV["type"] === predicate["type"] &&
			thisV["intentType"] === predicate["intentType"]) {
			returnObject.weight = thisV.weight;
			if (thisV.weight < minimumWeightForAccept) {
				returnObject.reasonsWhy.push(thisV);
				returnObject.accepted = false;
				return returnObject;
			}
			else {
				returnObject.reasonsWhy.push(thisV);
				returnObject.accepted = true;
				return returnObject;
			}
		}
		thisV = getNextVolition(key, responder, initiator);
	}

	return returnObject;
};

/**
 * Take a set of calculated volitions, sort it, and store it in the internal cache. Return an interface that allows for iterating through its results.
 *
 * @param  {String} key       An identifier for this volition set.
 * @param  {Object} volitions [description]
 *
 * @return {Object}           An interface with functions "getFirst" and "getNext" to iterate through the volitions for particular pair of characters.
 */
var register = function(key, volitions) {

	// Sort the passed-in volitions.
	//
	// Very simple function used by _.sortBy below to know how to order
	// the volition objects for a character set.
	var vSort = function(obj) {
		return -1 * obj.weight; // -1* since sort works in asending
	};

	// Each character pair in calculatedVolitions now needs to be sorted
	// in weight order. Use underscore sortBy on the weight key.
	var cast = _.keys(volitions);
	var castLength = cast.length;
	for (var first = 0; first < castLength; first++) {
		for (var second = 0; second < castLength; second++) {
			if (second === first) {
				//For 'undirected' volitions, we want people to be able to direct volitions towards themselves.
				//continue;
			}

			volitions[cast[first]][cast[second]] = _.sortBy(volitions[cast[first]][cast[second]], vSort);
		}
	}

	// Store the sorted volition object in our internal cache.
	volitionCache[key] = volitions;

	// Return an interface using currying to pre-fill the value
	// of key to the volition set in question.
	return {
		getFirst: function(first, second) {
			return getFirstVolition(key, first, second);
		},
		getNext: function(first, second) {
			return getNextVolition(key, first, second);
		},
		getWeight: function(first, second, predicate) {
			var tempPredicates = volitionCache[key][first][second];
			var checkNextPredicate = false;
			for (var i = 0 ; i < tempPredicates.length ; i += 1) {
				for (var key in predicate) {
					if (predicate[key] !== tempPredicates[key]) {
						checkNextPredicate = true;
						break;
					}
				}
				if(checkNextPredicate !== true) {
					return tempPredicates[i].weight;
				}
			}
			return 0;	// our default value
		},
		dump: function() {	// for testing
			return volitionCache[key];
		},
		isAccepted: function(initiator, responder, predicate) {
			return isAccepted(key, initiator, responder, predicate);
		}
	};
};

/**
 * Return a volitions object prepared to have a blank array for every  obj[first][second] pair of cast members.
 *
 * @param  {Array of Strings} cast Cast members to prepare the object with.
 *
 * @return {Object}      Prepared volitions object.
 */
var newSet = function(cast) {
	var volitionShell = {};
	if (cast === undefined) return volitionShell;
	for (var i = 0; i < cast.length; i++) {
		volitionShell[cast[i]] = {};
		for (var j = 0; j < cast.length; j++) {
			if (i === j) {
				//We want the i === j case to be represented, as a means of characters having undirected volitions (e.g., a character wants to boost their own intelligence).
				//continue;
			}
			volitionShell[cast[i]][cast[j]] = [];
		}
	}
	return volitionShell;
};

/**
 * @function getVolitionCacheByKey
 * @memberof Volition
 * @description Given a key, return the contents of the voitionCache at that point
 * @private
 * @param  {[string]} key [The identifier of a volition set.]
 * @return {[type]}     [The volitions of the specified key.]
 */
var getVolitionCacheByKey = function(key){
	return volitionCache[key];
};

/**
 * @functiongetAllVolitionsByKeyFromTo
 * @private
 * @memberof Volition
 * @param  {[string]} key  [The idenfifier of a volition set]
 * @param  {[string]} from [The 'initiator' that these volitions pertain to]
 * @param  {[string]} to   [The 'responder' that these volitions pertain to]
 * @return {[type]}      [The volitions from the volition set specified by key that describe what the 'from' character wants to do with the 'to' character]
 */
var getAllVolitionsByKeyFromTo = function(key, from, to){
	return volitionCache[key][from][to];
};

var volitionInterface = {
	newSet: newSet,
	register: register,
};

/* test-code */
volitionInterface.getVolitionCacheByKey = getVolitionCacheByKey;
volitionInterface.getAllVolitionsByKeyFromTo = getAllVolitionsByKeyFromTo;
volitionInterface.isAccepted = isAccepted;
/* end-test-code */

return volitionInterface;

})();
// MODULE validate
const validate = (function(){
/**
* This is the class Validate, for verification of predicates and other data.
*
*/
var allowedDirTypes = ["directed", "undirected", "reciprocal"];
var allowedOpsConditions = [">", "<", "="];
var allowedOpsEffects = ["+", "-", "="];
var allowedTurnConstants = ["now", "start"];

var socialStructure;
/**
 * @method registerSocialStructure
 * @memberOf Validate
 * @description Store a local copy of the registered social structure, to check predicates for validity. Called by ensemble.loadSocialStructure. Shouldn't be needed by end users.
 *
 * @param  {Object} ss     A reference to the social schema registered in ensemble.
 *
 */
var registerSocialStructure = function(ss) {
	socialStructure = ss;
};

/**
 * @method triggerCondition
 * @memberOf Validate
 * @description Checks that a trigger condition predicate is structured properly, throwing an error if it is not, and returning the predicate reference back if is.
 *
 * @param  {Object} pred     A trigger condition predicate object.
 * @param  {String} preamble Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invalid predicate can contain this information.
 *
 * @return {Object}          The same predicate reference passed in, if valid.
 */
var triggerCondition = function(pred, preamble) {
	checkPredicate(pred, "condition", "trigger", preamble);
	return pred;
};

/**
 * @method triggerEffect
 * @memberOf Validate
 * @description Checks that a trigger effect predicate is structured properly, throwing an error if it is not, and returning the predicate reference back if is.
 *
 * @param  {Object} pred     A trigger effect predicate object.
 * @param  {String} preamble Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invalid predicate can contain this information.
 *
 * @return {Object}          The same predicate reference passed in, if valid.
 */
var triggerEffect = function(pred, preamble) {
	checkPredicate(pred, "effect", "trigger", preamble);
	return pred;
};

/**
 * @method volitionCondition
 * @memberOf Validate
 * @description Checks that a volition condition predicate is structured properly, throwing an error if it is not, and returning the predicate reference back if is.
 *
 * @param  {Object} pred     A volition condition predicate object.
 * @param  {String} preamble Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invalid predicate can contain this information.
 *
 * @return {Object}          The same predicate reference passed in, if valid.
 */	
var volitionCondition = function(pred, preamble) {
	checkPredicate(pred, "condition", "volition", preamble);
	return pred;
};

/**
 * @method volitionEffect
 * @memberOf Validate
 * @description Checks that a volition effect predicate is structured properly, throwing an error if it is not, and returning the predicate reference back if is.
 *
 * @param  {Object} pred     A volition effect predicate object.
 * @param  {String} preamble Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invalid predicate can contain this information.
 *
 * @return {Object}          The same predicate reference passed in, if valid.
 */
var volitionEffect = function(pred, preamble) {
	checkPredicate(pred, "effect", "volition", preamble);
	return pred;
};

/**
 * @method blueprint
 * @memberOf Validate
 * @description Checks that a blueprint predicate is structured properly, throwing an error if it is not, and returning the predicate reference back if is.
 *
 * @param  {Object} pred     A blueprint predicate object.
 * @param  {String} preamble Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invalid predicate can contain this information.
 *
 * @return {Object}          The same predicate reference passed in, if valid.
 */

var blueprint = function(pred, preamble) {
	checkPredicate(pred, "blueprint", "", preamble);
	return pred;
};

/**
 * @method rule
 * @memberOf Validate
 * @description Checks to ensure a whole trigger or volition rule is valid. Returns the error message explaining what's wrong if it's not, otherwise returns the whole rule.
 *
 * @param  {Object} rule     An object containing a trigger or volition rule. Should have top level keys "conditions" and "effects". Auto-determines what kind of rule it is by checking to see whether the first effect includes a weight.
 *
 * @return {Object}          Either an object if valid (the original rule) or a string if invalid (the error message).
 */
var rule = function(rule) {
	var isVolition = rule.effects[0].weight !== undefined;
	var effectValidator = isVolition ? volitionEffect : triggerEffect;
	var conditionValidator = isVolition ? volitionCondition : triggerCondition;
	try {
		for (var i = 0; i < rule.effects.length; i++) {
			var effect = rule.effects[i];
			effectValidator(effect, "" + (isVolition ? "Volition" : "Trigger") + " Rule Effect #" + i);
		}
		for (var i = 0; i < rule.conditions.length; i++) {
			var condition = rule.conditions[i];
			conditionValidator(condition, "" + (isVolition ? "Volition" : "Trigger") + " Rule Condition #" + i);
		}
		if (rule.isActive !== undefined && typeof rule.isActive !== "boolean") {
			throw new Error("isActive, if present, must be a boolean");
		}
	} catch(e) {
		return e.message;
	}
	return rule;
}

/**
 * @method action
 * @memberOf Validate
 * @description Checks that an action is structured properly, throwing an error if it is not, and returning the predicate reference back if it is.
 * 
 * @param  {[Object]} pred     [An action predicate object.]
 * @param  {[String]} preamble [Optional string explaining the context of this predicate, i.e. the specific unit test it's part of, so the error thrown for an invaid predicate can contain this information.]
 * 
 * @return {[Object]}          [The same predicate reference passed in, if valid.]
 */
var action = function(pred, preamble) {
	console.log("TODO: Make Validate for reading in actions!");
	//checkPredicate(pred, "action", "", preamble);
	return pred;
}

/**
 * @method checkPredicate
 * @memberOf Validate
 * @description Internal function to deal with the wrapper functions triggerCondition, triggerEffect, volitionCondition, etc. Itself a wrapper for isPredBad, which handles the bulk of the work. Here we simply display diagnostic information to the console and throw an error if a bad predicate is found.
 * @private
 *
 * @param  {Object} pred     The predicate to check.
 * @param  {String} type     Predicate type, either "condition" or "effect"
 * @param  {String} category Subtype, if necessary (i.e. "trigger", "volition")
 * @param  {String} preamble Text explaining the origin of the predicate being tested.
 *
 * @return {Boolean}          Returns false (the result of isPredBad) or throws an error.
 */
var checkPredicate = function(pred, type, category, preamble) {
	var result = isPredBad(pred, type, category);
	if (result !== false) {
		console.log("Bad predicate: ", pred);
		throw new Error(preamble + " and found a malformed predicate: " + result + ".");
	}
	return result;
};

var isPredBad = function(predicate, type, category) {

	// Make a local copy of the predicate. We will strip fields out of this copy until we've validated all of them, or we are left with extra unrecognized fields.
	var pred = util.clone(predicate);

	// Create a variable to store information about what went wrong with the predicate.
	var msg = "";

	// Skip socialRecordLabel predicates for now.
	if (predicate.category === "socialRecordLabel" || predicate.category === "socialRecordLabelUndirected") return false;

	// Verify that the contents of a particular key exist and are of the expected type. If isRequired is false, it's okay for the given key to be missing. Add problem details to the isPredBad scoped "msg" variable.
	var isTypeWrong = function(pred, key, type, isRequired) {
		if (pred[key] === undefined) {
			if (!isRequired) {
				return false;
			}
			msg += "'" + key + "' was undefined";
			return true;
		}
		var jsType = typeof pred[key];
		if (type === "array" && util.isArray(pred[key])) {
			// Allow this to pass.
			type = "object";
		}
		if (jsType !== type) {
			msg += "'" + key + "' was '" + pred[key] + "' which seems to be of type '" + jsType + "' instead of '" + type + "'";
			return true;
		}
		return false;
	};

	if (isTypeWrong(pred, "category", "string", true)) {
		return msg;
	}

	// Handle blueprints.
	if (type === "blueprint") {
		if (!util.isArray(pred.types) || pred.types.length === 0 || typeof pred.types[0] !== "string") {
			return "key 'types' should be a non-empty array of strings; was '" + pred.types + "'";
		}
		delete pred.types;

		if (isTypeWrong(pred, "isBoolean", "boolean", true)) return msg;
		if (isTypeWrong(pred, "directionType", "string", true)) return msg;
		if (allowedDirTypes.indexOf(pred.directionType) < 0) {
			return "directionType was '" + pred.directionType + "' but it should have been one of " + util.listWriter(allowedDirTypes);
		}
		delete pred.directionType;

		if (isTypeWrong(pred, "duration", "number", false)) return msg;
		if (pred.duration !== undefined && (pred.duration < 1 || !util.isInt(pred.duration))) {
			return "duration was '" + pred.duration + "' which does not seem to be an integer > 0.";
		}
		delete pred.duration;

		if (pred.defaultValue !== undefined && (pred.isBoolean === true && typeof pred.defaultValue !== "boolean") || (pred.isBoolean === false && typeof pred.defaultValue !== "number")) {
			return "mismatch between blueprint isBoolean '" + pred.isBoolean + "' and type of defaultValue '" + pred.defaultValue + "' (" + typeof pred.defaultValue + ")";
		}
		delete pred.defaultValue;
		
		if (pred.isBoolean === true && ((pred.minValue !== undefined) || (pred.maxValue !== undefined))) {
			return "blueprint specifies this is a boolean type but provides a min ('" + pred.minValue + "') or max ('" + pred.maxValue + "') value: this is not allowed.";
		}
		if (pred.minValue !== undefined && typeof pred.minValue !== "number") {
			return "mismatch between blueprint and type of minValue '" + pred.minValue + "' (" + typeof pred.minValue + "); expected a number.";
		}
		delete pred.minValue;
		
		if (pred.maxValue !== undefined && typeof pred.maxValue !== "number") {
			return "mismatch between blueprint and type of maxValue '" + pred.maxValue + "' (" + typeof pred.maxValue + "); expected a number.";
		}
		delete pred.maxValue;

		if (isTypeWrong(pred, "actionable", "boolean", false)) return msg;
		delete pred.actionable;
		delete pred.cloneEachTimeStep;

		delete pred.isBoolean;
	} else {// if type is not blueprint

		// Lookup details about this predicate.
		if (socialStructure[pred.category] === undefined) {
			return "category '" + pred.category + "' is not a registered social scheme category.";
		}
		if (socialStructure[pred.category][pred.type] === undefined) {
			console.log("pred.category", pred.category, "pred.type", pred.type);
			console.log("socialStructure", socialStructure);
			return "found category " + pred.category + " type " + pred.type + " but that type does not appear to be registered for that category.";
		}
		var descriptors = socialStructure[pred.category][pred.type];
		var dir = descriptors.directionType;
		var isBool = descriptors.isBoolean;

		if (isTypeWrong(pred, "type", "string", true)) return msg;

		delete pred.type;

		if (isTypeWrong(pred, "first", "string", true)) return msg;
		// Could strengthen here to register cast and check we are specifying a character that's been defined.

		var okayOps = type === "condition" ? allowedOpsConditions : allowedOpsEffects;

		if (pred.operator !== undefined && okayOps.indexOf(pred.operator) < 0) {
			return "unrecognized operator: '" + pred.operator + "'. In " + type + " predicates, the only valid operators are " + util.listWriter(okayOps);
		}
		delete pred.operator;

		if (pred.second !== undefined && dir === "undirected") {
			return "key second: '" + pred.second + "' found but category '" + predicate.category + "' is undirected";
		}
		// Temporarily relaxing the below constraint, because it makes it hard to swap roles in the Rule Editor. (Currently, the editor validates any change by verifying the changed rule is valid with this code; however, to swap two roles, you must first change one role to the other, which makes the rule invalid. In some ways this is a sort of higher-level validity check which we don't conceptually account for now: a rule with the same person in both roles is technically valid, it just can't ever be true.)
		// if (pred.second !== undefined && pred.second === pred.first) {
		// 	return "key second: '" + pred.second + "' found but this is the same as key first; this is not allowed.";
		// }
		if (dir !== "undirected" && pred.second === undefined) {
			return "no 'second' found but type '" + pred.type + "' is " + dir + ".";
		}
		delete pred.first;
		delete pred.second;

		if (type === "condition" || (type === "effect" && category === "trigger")) {
			if (pred.value === undefined && !isBool) {
				return "'value' was undefined: for numeric types, must be defined";
			}
			if (!isBool && typeof pred.value !== "number") {
				return "'value' was '" + pred.value + "' which seems to be of type '" + typeof pred.value + "' but category '" + predicate.category + "' specifies isBoolean false";
			}
			if (!isBool && isNaN(pred.value)) {
				return "'value' was '" + pred.value + "' which is not a number: category '" + predicate.category + "' specifies numeric value";
			}
			if (isBool && typeof pred.value !== "boolean" && pred.value !== undefined) {
				return "'value' was '" + pred.value + "' which seems to be of type '" + typeof pred.value + "' but category '" + predicate.category + "' specifies isBoolean true";
			}
			if (!isBool) {
				if (typeof descriptors.max === "number" && pred.value > descriptors.max) {
					return "'value' was '" + pred.value + "' but that exceeds max of '" + descriptors.max + "' for category '" + predicate.category + "'";
				}
				if (typeof descriptors.min === "number" && pred.value < descriptors.min) {
					return "'value' was '" + pred.value + "' but that's below min of '" + descriptors.min + "' for category '" + predicate.category + "'";
				}
			}
			delete pred.value;
		}

		if (type === "condition") {

			if (pred.turnsAgoBetween !== undefined) {
				if (isTypeWrong(pred, "turnsAgoBetween", "array", false)) return msg;

				var tab = pred.turnsAgoBetween
				if (tab.length !== 2) {
					return "key turnsAgoBetween must be an array with exactly two entries; found " + tab.length + " (" + tab.join(", ") + ")";
				}

				var testTupleEntries = function(pos) {
					var validmsg = "entry " + pos + " of turnsAgoBetween tuple must be a positive integer representing a number of turns into the past to check, or a valid quoted keyword (" + allowedTurnConstants.join(", ") + ")";
					if (typeof tab[pos] === "string") {
						if (allowedTurnConstants.indexOf(tab[pos].toLowerCase()) < 0) {
							return validmsg + "; instead saw string '" + tab[pos] + "'";
						}
					} else if (typeof tab[pos] === "number") {
						if (!util.isInt(tab[pos])) {
							return validmsg + "; instead saw number '" + tab[pos] + "'"
						}
						if (tab[pos] < 0) {
							return validmsg + "; instead saw negative integer '" + tab[pos] + "'";
						}
					} else {
						return validmsg + "; instead saw " + typeof tab[pos] + " '" + tab[pos] + "'.";
					}
					return false;
				}
				var res;
				res = testTupleEntries(0);
				if (res !== false) return res;
				res = testTupleEntries(1);
				if (res !== false) return res;

				delete pred.turnsAgoBetween;
			}

			if (isTypeWrong(pred, "order", "number", false)) return msg;
			if (pred.order && (!util.isInt(pred.order) || pred.order < 0)) {
				return "key order: '" + pred.order + "' seems not to be a positive integer";
			}
			delete pred.order;

		} else if (type === "effect") {

			if (category === "volition") {
				if (isTypeWrong(pred, "weight", "number", true)) return msg;
				delete pred.weight;

				if (isTypeWrong(pred, "intentType", "boolean", true)) return msg;
				delete pred.intentType;

				delete pred.value
			}
		}
	}

	delete pred.category;

	// Look for extra keys.
	delete pred.comment;
	var remainingKeys = _.keys(pred);
	for (var i = 0; i < remainingKeys.length; i++) {
		if (pred[remainingKeys[i]] !== undefined) {
			return "found unexpected key for " + type + " predicate: '" + remainingKeys[i] + "'";
		}
	}
	return false;
};

var validateInterface = {

	rule: rule,
	triggerCondition: triggerCondition,
	triggerEffect: triggerEffect,
	volitionCondition: volitionCondition,
	volitionEffect: volitionEffect,
	blueprint: blueprint,
	action: action,

	// TODO figure out how to avoid exporting this at all
	// (we should just be able to call ensemble.getSocialStructure when necessary)
	registerSocialStructure: registerSocialStructure

};

/* test-code */
/* end-test-code */

return validateInterface;

})();
// MODULE ensemble
const ensemble = (function(){
/*global define */
/**
* This class is the top level interface into ensemble. By including ensemble.js in your project,<BR><BR>
you should be given access to an ensemble singleton object, which you can then use to call each of these methods.<BR><BR>
Then you'll probably want to call ensemble.init(), ensemble.loadFile() for your schema, trigger rules, volition rules, characters, history, and actions.
*
*
* @class ensemble
*/

/**
 * @method loadBaseBlueprints
 * @memberof ensemble
 * @private
 * 
 * @description Loads a stock set of blueprints useful for testing. (relationship, networks, etc.)
 *
 * @param {Object} bp - a blueprint object.
 * 
 * @return {Object} An object with an interface to the loaded factories.
 */
var loadBaseBlueprints = function(bp) {
	socialRecord.clearEverything();
	return loadSocialStructure( bp );
};


/**
 * @method loadFile
 * @memberof ensemble
 * @public
 * 
 * @description Will load in a JSON file that represents one of the following aspects of your social world: Volition Rules, Trigger Rules, Characters, Schema, Actions, History. This function needs to be called once for each file. It returns a JSON object representing the parsed contents of the file referenced via the passed in filename.
 *
 * @param {String} filename - The relative path to the data file.
 *
 * @example var rawSchema = ensemble.loadFile(data/schema.json) // Assuming that, relative to the file this function is being called from, there is a data directory with the file schema.json, the schema will be loaded into Ensemble, and rawSchema will have the contents of the json file.
 * 
 * @return {Object} A JSON object representing the parsed contents of the filename.
 */
var loadFile = function(filename) {

	var fileResults;

	if (!window.XMLHttpRequest) {
		console.log("Browser doesn't support XMLHttpRequest.");
		return false;
	}
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			fileResults = JSON.parse(xmlhttp.responseText);
		} else {
			console.log("xmlhttp not ready!");
			return false;
		}
	}

	xmlhttp.open("GET", filename, false); // false = synchronously
	xmlhttp.send();

	return fileResults;
}


/**
* @method registerSocialType
* @memberOf ensemble
* @private
* @description Register an individual type for use with ensemble.
*
* @param {Object} blueprint A blueprint specifying the parameters of this social type.
*
* @return {Object} A copy of the blueprint.
*/
var registerSocialType = function(blueprint) {
	var factory = {};
	factory.category = blueprint.category;
	factory.type = blueprint.type;
	factory.directionType = blueprint.directionType;
	factory.isBoolean = blueprint.isBoolean;
	factory.cloneEachTimeStep = blueprint.cloneEachTimeStep;
	factory.duration = blueprint.duration;
	factory.min = blueprint.minValue;
	factory.max = blueprint.maxValue;
	factory.defaultVal = blueprint.defaultValue;
	factory.actionable = blueprint.actionable;
	return factory;
}

var socialStructure;

/**
 * @method loadSocialStructure
 * @memberOf ensemble
 * @public
 * @description Take a JSON object specifying a Schema, and generates a
 * set of factories with interfaces into that specification, allowing other aspects of ensemble
 * (history, rules, actions, etc.) to reference them. This should be called before loading in any
 * other aspects of ensemble (history, rules, actions, etc.).
 *
 * @param  {Object} data The JSON object to load, representing the social world's schema.
 * @example var rawSchema = ensemble.loadFile("data/schema.json");
var schema = ensemble.loadSocialStructure(rawSchema);
 * @return {Object} An object with parameters for each category name specified in the data file.
 */
var loadSocialStructure = function(data) {
	var structure = {};

	var blueprints;
	try {
		if (typeof data === "string") {
			blueprints = (JSON.parse(data)).schema;
		} else if (typeof data === "object") {
			blueprints = data.schema;
		} else {
			console.log("unexpected value:", data);
			throw new Error("Error load social structure: unexpected data value: ", typeof data);
		}
	} catch (e) {
		throw new Error("JSON Error load social structure (blueprints): " + e);
	}
	if (blueprints === undefined) {
		throw new Error("Error: social structure data file must be JSON that defines a top-level key 'schema'");
	}

	var atLeastOneCategoryAllowsIntent = false;
	var i;
	for (i = 0; i < blueprints.length; i++) {
		if (blueprints[i].actionable === true) {
			atLeastOneCategoryAllowsIntent = true;
			break;
		}
	}
	if (!atLeastOneCategoryAllowsIntent) {
		throw new Error("SCHEMA ERROR: A schema must include at least one category where actionable is true, otherwise there are no possible actions for characters to take.");
	}

	socialStructure = structure;
	for (i = 0; i < blueprints.length; i++) {
		loadBlueprint(blueprints[i], i);
	}

	validate.registerSocialStructure(socialStructure);
	return socialStructure;
};

/**
 * @method loadBlueprint
 * @memberOf ensemble
 * @private
 * @description Load a single schema blueprint. In most cases, you
 * should use loadSocialStructure to load a set at once and do
 * some checking on the set as a whole.
 *
 * @param	{Object}	categoryBlueprint	The blueprint object to load
 * @param	{Number}	When loading multiple blueprints, can pass an ID number to be printed if necessary for diagnostics.
 * 
 */
var loadBlueprint = function(categoryBlueprint, num) {

	// Error Checking
	if (socialStructure[categoryBlueprint.category]) {
		throw new Error("DATA ERROR in ensemble.loadSocialStructure: the category '" + categoryBlueprint.category + "' is defined more than once.");
	}

	validate.blueprint(categoryBlueprint, "Examining blueprint  #" + num);

	socialRecord.registerDuration(categoryBlueprint);
	socialRecord.registerDefault(categoryBlueprint);
	socialRecord.registerDirection(categoryBlueprint);
	socialRecord.registerIsBoolean(categoryBlueprint);
	socialRecord.registerMaxValue(categoryBlueprint);
	socialRecord.registerMinValue(categoryBlueprint);

	// Create an interface for each type within this category.
	socialStructure[categoryBlueprint.category] = {};
	for (var j = 0; j < categoryBlueprint.types.length; j++) {
		var type = categoryBlueprint.types[j].toLowerCase();
		var typeBlueprint = util.clone(categoryBlueprint);
		typeBlueprint.type = type;
		socialStructure[categoryBlueprint.category][type] = registerSocialType(typeBlueprint);
	}
}

/**
 * @method updateCategory
 * @memberOf ensemble
 * @private
 * @description Refresh the definition of a schema category. NOTE: This will not automatically check for conflicts with existing rules, social records, etc.: probably useful only in the context of a schema editor program that is taking care of that stuff.
 *
	 * @param  {String} categoryKey The social category to update.
	 * @param  {Object} blueprint	A new specification for this category, in the same format as blueprints passed into loadSocialStructure. If this is undefined, the old category will simply be deleted.
	 *
 */
var updateCategory = function(categoryKey, blueprint) {
	delete socialStructure[categoryKey];
	if (blueprint) {
		loadBlueprint(blueprint, 0);
	}
	// TODO: Technically, if the name of the category changes, this is leaving behind old duration, direction, default etc. values in the socialRecord internals. I don't believe this harms anything, but it's a bit messy.
}

/**
 * @method getSocialStructure
 * @memberOf ensemble
 * @public
 * @description Returns an object reference describing the social structure loaded into ensemble. 
 * @example ensemble.getSocialStructure();
 * @return {Object} A dictionary with top level keys will be each of the social "categories" (a la "relationship", "network", etc.). Each of these contains a dictionary of its subtypes. 
 */
var getSocialStructure = function() {
	return socialStructure;
}

/**
 * @method getSchema
 * @memberOf ensemble
 * @public
 * @description Returns an object describing the active social structure in the same format as the original file: 
 * @return {Array} An array of objects, one for each category, with a field "types" with all the type name for that category, etc. (see format for loadSocialStructure)
 */
var getSchema = function() {
	var schemaItems = [];
	for (var catKey in socialStructure) {
		if (catKey === "schemaOrigin") {
			continue;
		}
		var item = {};
		item = getCategoryDescriptors(catKey);
		item.category = catKey;
		item.types = Object.keys(socialStructure[catKey]);
		
		// TODO: Standardize field names between external files and internal representation, so the below isn't necessary.
		item.defaultValue = item.defaultVal;
		delete item.defaultVal;
		item.maxValue = item.max;
		delete item.max;
		item.minValue = item.min;
		delete item.min;

		schemaItems.push(item);
	}
	return schemaItems;
}


/**
 * @method getCategoryDescriptors
 * @memberOf ensemble
 * @public
 * @description Returns an object containing fields describing the properties of a given category registered with ensemble
 *
 * @param  {String} categoryName The social category to get information about.
 * @example var categoryDescriptors = ensemble.getCategoryDescriptors("traits");
 * @return {Object} A dictionary with keys for each piece of metadata about the social category: "directionType" will be directed, undirected, or reciprocal; "isBoolean" will be true or false (false = numeric). 
 */
var getCategoryDescriptors = function(categoryName) {
	var descriptors = {};
	var c = socialStructure[categoryName];
	if (c === undefined) {
		return false;
	}
	// The details for every type within a category should be the same, so just go with the first one.
	for (var typeName in c) {
		var t = c[typeName];
		var representativeType = Object.keys(c)[0];
		descriptors.actionable = c[representativeType].actionable;
		descriptors.directionType = t.directionType;
		descriptors.isBoolean = t.isBoolean;
		// TODO: I believe cloneEachTimeStep is deprecated in favor of duration: 0. Verify and refactor.
		descriptors.cloneEachTimeStep = t.cloneEachTimeStep === undefined ? true : t.cloneEachTimeStep;
		descriptors.duration = t.duration;
		descriptors.min = t.min;
		descriptors.max = t.max;
		descriptors.defaultVal = t.defaultVal;
		return descriptors;
	}
	// If the category was somehow empty, also return false.
	return false;
}


//TODO: This method is unreliable if we allow the same type name to appear in multiple categoryes, which we currently do.
//@method getCategoryFromType
//@memberOf ensemble
//@public
//@description Returns the category name associated with a particular type. 
//
// @param  {String} type A type from a social scheme (i.e. "friends").
//
// @return {String} The name of the social category to which that type belongs (i.e. "relationships"), or false if none was found. 
//
var getCategoryFromType = function(type) {
	for (var categoryName in socialStructure) {
		if (socialStructure[categoryName][type] !== undefined) {
			return categoryName;
		}
	}
	return false;
}

/**
 * @method isValidTypeForCategory
 * @memberOf ensemble
 * @public
 * @description Given a type and a category name, checks to see if the type is in fact specified by the scema as being a potential type for that category.
 * @param {String} type The Type to validate existing inside of the specified category.
 * @param  {String} categoryName The social category to verify the type's membership of.
 * @example if(ensemble.isValidTypeForCategory("kindness", "trait"){
//do stuff if kindness is a type of trait in your schema.
}
 * @return {Boolean} True if the type is in the category, false otherwise.
 */
var isValidTypeForCategory = function(type, categoryName) {
	var cn = socialStructure[categoryName];
	if (cn === undefined) return false;
	if (cn[type] === undefined) return false;
	return true;
}


var getSortedTurnsTuple = function(tab) {
	var t0Val = tab[0];
	var t1Val = tab[1];
	if (t0Val === "START") {
		t0Val = 9999999999;
	}
	if (t0Val === "NOW") {
		t0Val = 0;
	}
	if (t1Val === "START") {
		t1Val = 9999999999;
	}
	if (t1Val === "NOW") {
		t1Val = 0;
	}
	if (t0Val > t1Val) {
		var tmp = tab[0];
		tab[0] = tab[1];
		tab[1] = tmp;
	}
	return tab;
}

var savedChars;

/**
 * @method addCharacters
 * @public
 * @memberOf ensemble
 * 
 * @description Load from file the characters 
 *
@example var rawCast = ensemble.loadFile("data/cast.json"); 
var cast = ensemble.addCharacters(rawCast);

 * @param {Object} data A file defining the characters in this story. Should contain a single top-level key, "cast", which holds a dictionary of character identifiers, each containing an object with character metadata. If the object contains a key "name" with the printed name of the character, the getCharName function can be used to quickly return this.
 *
 * @return {Array}      An array of strings with all character keys.
 */
var addCharacters = function(data) {
	// STUB: For the moment we aren't doing anything with this data,
	// other than returning an array of keys.
	var charData = data;
	var chars = charData.cast;
	savedChars = chars;
	return getCharacters();
};

/**
 * @method getCharacters
 * @public
 * @memberOf ensemble
 * @description Returns an array of character IDs for all registered characters.
 * @example myCharacters = ensemble.getCharacters();
 * @return {Array}      An array of strings with all character keys (same as will be used in socialRecord entries, etc..
 */
var getCharacters = function() {
	return _.keys(savedChars);
};

/**
 * @method getCharactersWithMetadata
 * @public
 * @memberOf ensemble
 * @description Returns the full dictionary of all character info.
 * @example myCharacters = ensemble.getCharactersWithMetadata();
 * @return {Object}      A dictionary with the full record of all registered characters.
 */
var getCharactersWithMetadata = function() {
	return util.clone(savedChars);
};

/**
 * @method getCharData
 * @public
 * @memberOf ensemble
 * @description Returns a specific piece of metadata for a registered character.
 *
 * @param {String} char The ID of a registered character.
 * @param {String} key The metadata field requested.
 * @exampe var bobNickname = ensemble.getCharData("bob", "name");
 * @return {Object}      The metadata value for the requested character and key, or undefined if no such key or character were found. The type of the return result is dependent on the type of the requested metadata field.
 */
var getCharData = function(char, key) {
	if (savedChars[char] === undefined) {
		return undefined;
	}
	return savedChars[char][key];
};

/**
 * @method getCharName
 * @public
 * @memberOf ensemble
 * @description Shorthand function to return the printed name of a registered character. getCharName("sarah") is identical to getCharData("sarah", "name"). Returns the character key if no "name" field was found, or undefined if the requested character ID was not found.
 *
 * @param {String} char The ID of a registered character.
 *
 * @return {String}      The printed name of the requested character.
 */
var getCharName = function(char) {
	var name = getCharData(char, "name");

	// If name is undefined, just return the character's ID.
	return name || char;
};

/**
 * @method addProcessedRules
 * @private
 * @memberOf ensemble
 * @description Takes a preprocessed rule object and metadata, validates it, and registers it. Note: addRules() should be called by outside modules, which does the preprocessing.
 *
 * @param {String} ruleType The key to identify this ruleset. If "trigger" or "volition", run extra validation code to verify these kinds of rules are constructed properly.
 * @param {String} fileName Identifying info about the source of these rules, useful if we need to print error messages.
 * @param {Object} rues An array of rule objects, each of which should specify a human-readable "name" key.
 *
 * @return {Array}      An array of strings, unique IDs for each rule added, in the form type_num (i.e. triggerRules_14). 
 */
var addProcessedRules = function(ruleType, fileName, rules) {

	var conditionValFunc;
	var effectValFunc;

	var ids = [];

	if (ruleType === "trigger" || ruleType === "volition") {
		conditionValFunc = ruleType === "trigger" ? validate.triggerCondition : validate.volitionCondition;
		effectValFunc = ruleType === "trigger" ? validate.triggerEffect : validate.volitionEffect;
		ruleType = ruleType + "Rules";
	}

	// Validate data.
	var i, j, rule, tab;
	for (i = 0; i < rules.length; i++) {

		rule = rules[i];
		if (rule.name === undefined) {
			console.log("Warning: " + ruleType + " Rule #" + i + " is missing a 'name'.");
		}
		//Store the 'origin' of this rule, so we'll always be able to know where it came from, and give it a unique ID.
		rule.origin = fileName;
		var newId = ruleType + "_" + util.iterator("rules");
		ids.push(newId);
		rule.id = newId;


		// Check conditions
		if (conditionValFunc !== undefined) {
			for (j = 0; j < rule.conditions.length; j++) {
				var condRef = rule.conditions[j];

				//Make uniform aspects of predicates that can be written in multiple valid ways.
				condRef = standardizePredicate(condRef);

				conditionValFunc(condRef, "Examining " + ruleType + " rule #" + i + ": '" + rule.name + "' Validating condition at position " + j);
				
			}
		}

		// Check effects
		if (effectValFunc !== undefined) {
			for (j = 0; j < rule.effects.length; j++) {
				var effectRef = rule.effects[j];
				//Make uniform aspects of predicates that can be written in multiple valid ways.
				effectRef = standardizePredicate(effectRef);

				effectValFunc(effectRef, "Examining " + ruleType + " rule #" + i + ": '" + rule.name + "' Validating effect at position " + j);
			}
		}			
	}

	if (rules.length > 0) {
		ruleLibrary.addRuleSet(ruleType, rules);
		return ids;
	} else {
		return [];
	}
};


//standardize a predicate (called before validation).
var standardizePredicate = function(pred){

	//Convert string vlaues of "intentType" to a boolean
	//(after making sure that the string value used makes sense given the pred's
	//"isBoolean" value)
	var intentType = pred.intentType;
	var categoryDescriptors = getCategoryDescriptors(pred.category);
	if(typeof intentType === "string"){ // not every predicate has an intentType, only standardize this if it has it (and is a string, as if it is already a boolean our work is done for us.)
		if(intentType.toLowerCase() === "start"){
			//isBoolean better be true!
			if(!categoryDescriptors.isBoolean){
				//User specified a boolean specific intentType, but the predicate is numeric! Problem!
				console.log("problem predicate: " , pred);
				throw new Error("Error! predicate has a boolean-only intentType (" + intentType + ") but is numeric!");
			}
			else{
				//everything is ok! Let's standardize!
				pred.intentType = true;
			}
		}
		else if(intentType.toLowerCase() === "increase"){
			//isBoolean better be false!
			if(categoryDescriptors.isBoolean){
				//user specified a numeric specific intent type but the predicate is a boolean! 
				console.log("problem predicate: " , pred);
				throw new Error("Error loading in predicate -- it has a numeric-only intentType (" + intentType + ") but is a boolean!");
			}
			else{
				//Everything is ok! time to standardize!
				pred.intentType = true;
			}
		}
		else if(intentType.toLowerCase() === "stop"){
			//isBoolean better be true!
			if(!categoryDescriptors.isBoolean){
				//user specified a boolean specific intentType but the predicate is numeric!
				console.log("problem predicate: " , pred);
				throw new Error("Error loading in predicate -- it has a boolean specific intentType ( " + intentType + ") but is numeric!");
			}
			else{
				//Everything is ok! standardize.
				pred.intentType = false;
			}
		}
		else if(intentType.toLowerCase() === "decrease"){
			//isBoolean better be false.
			if(categoryDescriptors.isBoolean){
				//user specified a numeric specific intentType but the predicate is boolean.
				console.log("problem predicate: " , pred);
				throw new Error("Error loading in predicate -- it has a numeric specific intentType ( " + intentType + ") but is boolean!");
			}
			else{
				//Everything is ok. Standardize.
				pred.intentType = false;
			}
		}
	}

	// Sort turnsAgoBetween tuple, if present, low-hi.
	if (pred.turnsAgoBetween !== undefined) {
		pred.turnsAgoBetween = getSortedTurnsTuple(pred.turnsAgoBetween);
	}

	return pred;
}



//TODO: To fully support custom rulesets, we will need to add another function to RuleLibrary: getRulesByKey(key) that takes in a key, and returns the ruleset specified by that key.
/**
 *@method addRules
 *@memberof ensemble
 *@public
 * 
 * @description Takes raw rules data, parses out metadata and verifies the data is structured correctly, then calls the private function addProcessedRules to validate and register these rules into ensemble. This function should be the only one used to add rules. It should be called for each separate rule file that needs to be loaded in. You should expect to call this function at least twice: once for volition rules, and once for trigger rules.
 * 
 *
 @example var rawTriggerRules = ensemble.loadFile("data/triggerRules.json");
var triggerRules = ensemble.addRules(rawTriggerRules);
		
var rawVolitionRules = ensemble.loadFile("data/volitionRules.json");
var volitionRules = ensemble.addRules(rawVolitionRules);
 * @param {Object} data Stringified JSON or Object which should define top level keys "fileName", "ruleType", and "rules".
 *
 * @return {Array}      An array of strings, unique IDs for each rule added, in the form type_num (i.e. triggerRules_14). 
 * 
 */
var addRules = function(data){
	var parsedData;
	var ruleType;
	var fileName;
	var rules;

	try {
		if (typeof data === "string") {
			parsedData = JSON.parse(data);
		} else if (typeof data === "object") {
			parsedData = data;
		} else {
			console.log("unexpected value:", data);
			throw new Error("Error adding rules: unexpected data value: ", typeof data);
		}
	} catch (e) {
		throw new Error("JSON Error loading rules: " + e);
	}
	console.log("parsedData", parsedData);

	fileName = parsedData.fileName;
	rules = parsedData.rules;
	ruleType = parsedData.type;

	if (rules === undefined) {
		throw new Error("Error: " + ruleType + " rules data file must include a top-level key 'rules'");
	}
	if (ruleType === undefined) {
		throw new Error("Error: " + ruleType + " rules data file must include a top-level key 'type' that is either 'trigger', 'volition', or a custom ruleset key.");
	}

	return addProcessedRules(ruleType, fileName, rules);

};


/**
 *@method getRules
 *@memberof ensemble
 *@public
 * 
 * @description Given a string representation of a rule set (either "trigger" or "volition"), returns
 * all of the rules that are registered to that rule set. At present there is no functionalit for 
 * rules outside of these two rulesets. This function is intended for reviewing what rules have been
 * registered to ensemble. 
 * 
 *
 * @example var triggerRules = ensemble.getRules("trigger");
 * @example var volitionRules = ensemble.getRules("volition");
 * @param {String} The ruleset you wish to collect all of the rules from. "trigger" or "volition" are the only accepted answers.
 *
 * @return {Object} A collection of rules registered to the specified rule set.
 * 
 */
var getRules = function(ruleSet) {
	if (ruleSet === "trigger") {
		return ruleLibrary.getTriggerRules();
	}
	if (ruleSet === "volition") {
		return ruleLibrary.getVolitionRules();
	}
	console.log("No functionality yet for retrieving a ruleset that's neither trigger nor volition.");
	return [];
}

/**
 *@method filterRules
 *@memberof ensemble
 *@public
 * 
 * @description When given a ruleset and an object specifying search criteria, return only the rules from the ruleset that match. The object passed in is the same as a search object you'd use with ensemble.get() i.e., { category: "traits" }. All rules having any conditions or effects that match the request are returned.
 *
 * @param {String} ruleSet The ruleset to search (probably "trigger" or "volition").
 *
 * @param {Object} criteria Currently supports a single key-value pair matching one aspect of a predicate.
 * 
 * @example var ruleSet = "volition";
var criterea = {"type":"kind"};
var filteredRules = ensemble.filterRules(ruleSet, criterea);
 * @return {Array}      An array of matching rules. 
 * 
 */
var filterRules = function(ruleSet, criteria) {
	var itemsToFilter = getRules(ruleSet);
	var predicateArrays = ["conditions", "effects"];
	return _filter(itemsToFilter, predicateArrays, criteria);
}

/**
 *@method filterActions
 *@memberof ensemble
 *@public
 * 
 * @description When given an object specifying search criteria, return only the actions that match the given terms. The object passed in is the same as a search object you'd use with ensemble.get() e.g., { "category": "traits" }. All actions having any conditions, effects, or influenceRules that match the request are returned.
 *
 * @param {Object} criteria Currently supports a single key-value pair matching one aspect of a predicate.
 * @example var criteria = {"type": "kind"}; 
var filteredActions = ensemble.filterActions(criteria)
 *@return {Array}      An array of matching actions. 
 * 
 */
var filterActions = function(criteria) {
	var itemsToFilter = actionLibrary.getAllActions();
	var predicateArrays = ["conditions", "effects", "influenceRules"];
	return _filter(itemsToFilter, predicateArrays, criteria);
}

// Internal function used by filterRules and filterActions. Given an array of records and a list of fields to check, iterates through records in those fields excluding any that don't match the given criteria.
var _filter = function(set, fields, criteria) {
	return set.filter(function(record) {
		var matchFound;
		for (var key in criteria) {
			matchFound = false;
			var fieldPos = 0;
			while (!matchFound && fieldPos < fields.length) {
				var field = fields[fieldPos];
				if (record[field]) {
					for (var i = 0; i < record[field].length; i++) {
						if (record[field][i][key] === criteria[key]) {
							matchFound = true;
							break;
						}
					}
				}
				fieldPos += 1;
			}
			if (!matchFound) {
				break;
			}
		}
		return matchFound;
	});
}


var setRuleById = function(label, rule) {

	var ruleSet = label.split("_")[0];

	// Ensure the new rule is valid.
	var results = validate.rule(rule);
	if (typeof results === "string") {
		// Validation failed.
		console.log("Tried to setRulesById for '" + label + "' but validation failed: " + results);
		return false;
	}

	// DISABLED check for existing rule, b/c this flags as true when updating a rule! What we actually need is a way for isRuleAlreadyInRuleSet to return the ID of the matching rule(s), so we could allow that in this case.
	// if (ruleLibrary.isRuleAlreadyInRuleSet(ruleSet, rule)) {
	// 	console.log("Tried to setRulesById for '" + label + "' but an identical rule already exists.");
	// 	return false;
	// }

	return ruleLibrary.setRuleById(label, rule);
}

	/**
* @description A shortcut to set a full array of predicates (useful to be called with the effects array of a rule!)
*
* @method setPredicates
* @memberof ensemble
* @param {String} predicateArray an array of predicates to be added to the social record.
@example ensemble.setPredicates(myTriggerRule.effects);
*/
var setPredicates = function(predicateArray){
	for(var i = 0; i < predicateArray.length; i += 1){
		socialRecord.set(predicateArray[i]);
	}
}

/**
* @description constructs a search predicate for you, then calls getSocialRecord
*
* @method getValue
* @memberof ensemble
* @param {String} first the name of the character to occupy the "first" role in our search predicate.
* @param {String} second the name of the character to occupy the "second" role in our search predicate.
* @param {String} category the category from our social schema that the social record of interest is from.
* @param {String} type the specific type of the specified category that we are interested in learning the value of.
* @param {Int} mostRecentTime establishes the upper bound of the window into the history to look. 0 (or undefined) means the current timestep.
* @param {Int} lessRecentTime establishes the lower bound of the window into the history to look. undefined will simply only look at the current timestep.
@example var predicateValue = ensemble.getValue("bob", "carol", "relationship", "dating", 0, 0); 
*@return {Number or Boolean} the value of the specified type between the specified characters. Could either be a number of boolean, as the value might be referring to a boolean type or a numeric one.
*/
var getValue = function(first, second, category, type, mostRecentTime, lessRecentTime){
	var searchPredicate = {};
	searchPredicate.first = first;
	searchPredicate.second = second;
	searchPredicate.category = category;
	searchPredicate.type = type;
	var returnArray = getSocialRecord(searchPredicate, mostRecentTime, lessRecentTime);
	var returnObject = returnArray[0];
	var value = returnObject.value;
	return value;
};

// Public-facing function to access the socialRecord. Does verification on input. Internal functions should use socialRecord.get instead.
/**
* @description  Search the socialRecord for a desired searchPredicate within a provided time period. 
If mostRecentTime and leastRecentTime exist but are formatted improperly 
(i.e., mostRecentTime is a higher number than lessRecentTime), 
then the function will automatically swap the vaues between the two. If msotRecentTime and lessRecentTime
are not provided, the system will only look at the current timestep.
*
* @method get
* @memberof ensemble
* @param {Object} searchPredicate  a predicate we want to search the socialRecord for
* @param {Number} mostRecentTime  the lower bound time that we want to look within (turns ago: 2 = currentTimeStep-2)
* @param {Number} leastRecentTime  the upper bound time that we want to look within (turns ago: 2 = currentTimeStep-2)
* @param {Bool} useDefaultValue  If true, then if the searchPredicate is not explicitly found in the socialRecord it will check the searchPredicate against the predicate's default value. If false, it will not. Defaults to true.
* @example var searchPredicate =  {"category" : "trait", "type":"kind", "first":"x", "value":"true"};
var matchedRecords = ensemble.getSocialRecord(searchPredicate, 2, 5);
*@return {Array} matchedResults	the array holding the found predicates which match the query
*/
var getSocialRecord = function(searchPredicate, mostRecentTime, lessRecentTime) {

	// TODO: Make sure operator is not + or -

	// Ensure time window. Set to 0 if undefined.
	mostRecentTime = mostRecentTime || 0;
	lessRecentTime = lessRecentTime || 0;

	// Convert turnsAgoBetween to time window.
	if (searchPredicate.turnsAgoBetween !== undefined) {
		mostRecentTime += searchPredicate.turnsAgoBetween[0];
		lessRecentTime += searchPredicate.turnsAgoBetween[1];
	}

	// Ensure proper time window ordering.
	if (mostRecentTime > lessRecentTime){
		var tmp = mostRecentTime;
		mostRecentTime = lessRecentTime;
		lessRecentTime = tmp;
	}

	// Ensure socialRecord has been initialized.
	if (socialRecord.getCurrentTimeStep() === -1) {
		socialRecord.setupNextTimeStep(0);
	}

	return socialRecord.get(searchPredicate, mostRecentTime, lessRecentTime);
};



/**
 * @method setCharacterOffstage
 * @public
 * @memberOf ensemble
 * @description public facing function to put a character offstage. A character being offstage means that they will not have volition rules computed for them, nor are they eligible to take actions (or be acted upon).
 * @param characterName the name of the character to put off stage.
 * @example ensemble.setCharacterOffstage("bob");
 */
var setCharacterOffstage = function(characterName){
	socialRecord.putCharacterOffstage(characterName);
};

/**
 * @method setCharacterOffstage
 * @public
 * @memberOf ensemble
 * @description public facing function to see if a character is offstage or not.
 * @param characterName the name of the character to verify their presence on the stage.
 * @example var isBobOffstage = ensemble.getIsCharacterOffstage("bob");
 * @return {Boolean} true if the character is offstage, false otherwise.
 */
//
var getIsCharacterOffstage = function(characterName){
	return(socialRecord.getIsCharacterOffstage(characterName));
};

/**
 * @method setCharacterOffstage
 * @public
 * @memberOf ensemble
 * @description public facing function to place a character onstage.
 * @param characterName the name of the character to place on stage.
  Characters are considered "on stage" by default; this function should 
  only need to be called if a character had been manually placed off stage,
   but now needs return to it.
 * @example  ensemble.setCharacterOnstage("bob");
 */
var setCharacterOnstage = function(characterName){
	socialRecord.putCharacterOnstage(characterName);
};


/**
 * @method getIsCharacterOnStage
 * @public
 * @memberOf ensemble
 * @description public facing function to check if a character is on stage.
 * @param characterName the name of the character to verify if they are on stage.
 * @example  var isBobOnstage = ensemble.getIsCharacterOnstage("bob");
 * @return {Boolean} true if the character is on stage, false otherwise.
 */
var getIsCharacterOnstage	= function(characterName){
	var characterOffstage = socialRecord.getIsCharacterOffstage(characterName);
	return (!characterOffstage);
};


/**
 * @method getIsCharacterOnStage
 * @public
 * @memberOf ensemble
 * @description public facing fuction to make a character eliminated. Eliminated characters are completely ignored by the system.
 * @param characterName the name of the character to verify if they are on stage.
 * @example  ensemble.setCharacterEliminated("bob"); // Bob is now eliminated.
 */
var setCharacterEliminated = function(characterName){
	socialRecord.eliminateCharacter(characterName);
};

//
/**
 * @method getIsCharacterEliminated
 * @public
 * @memberOf ensemble
 * @description public facing function to see if a character has been eliminated or not.
 * @param characterName the name of the character to verify if they are eliminated.
 * @example  var isBobEliminated = ensemble.getIsCharacterEliminated("bob");
 * @return {Boolean} true if the character is eliminated, false otherwise.
 */
var getIsCharacterEliminated  = function(characterName){
	socialRecord.getIsCharacterEliminated(characterName);
};

//public facing function to make two characters perform an action.
//TODO: doActon doesn't seem to exist anymore?
/**
 * @method doAction
 * @private
 * @memberOf ensemble
 * @description In theory this is a means to just run an action... though it seems as if the corresponding function in ActionLibrary.js hasn't actually been written? Very odd...
 * @param {String} actionName the name of the action to perform.
 * @param {String} initiator the name of the character to perform the action.
 * @param {String} responder The name of the character who will be the recipient of the action.
 * @param {Object} registeredVolitions A calculated volitions object (created after calling ensemble.calculateVolitions)
 * @example  ensemble.doAction("AskOut", "Bob", "Carol", volitionObject)
 */
var doAction = function(actionName, initiator, responder, registeredVolitions){
	actionLibrary.doAction(actionName, initiator, responder, registeredVolitions);
};


/**
 * @method reset
 * @public
 * @memberOf ensemble
 * @description Clear out the history and the rules currently loaded into Ensemble. 
 CAUTION: once you call this, you will have to reload in more rules/history, 
 or else calculating volition or running trigger rules will do nothing!
 * @example ensemble.reset();
 */
var reset = function() {
	// Clear all social structure info.
	socialStructure = undefined;

	// Clear all character info
	// For now, we aren't storing this anyway.

	// Clear the socialRecord History.
	socialRecord.clearEverything();

	// Clear all rules.
	ruleLibrary.clearRuleLibrary();
};



/***************************************************************/
/* INTERFACE */
/***************************************************************/

/**
 * @method init
 * @public
 * @memberOf ensemble
 * @description initializes ensemble to be ready for use. This should be the first thing called before any other usage of ensemble.
 * @example var loadResult = ensemble.init(); // loadResult should be "Ok";
 * @return {String} Returns a success message upon initialization.
 *
 */
var init = function() {
	socialRecord.init();		
	return "Ok";
};

var ensembleInterface = {
	init					: init,
	loadSocialStructure		: loadSocialStructure,
	getSocialStructure		: getSocialStructure,
	getSchema				: getSchema,
	loadBlueprint			: loadBlueprint,
	getCategoryDescriptors		: getCategoryDescriptors,
	getCategoryFromType		: getCategoryFromType,
	isValidTypeForCategory		: isValidTypeForCategory,
	updateCategory			: updateCategory,
	addCharacters			: addCharacters,
	getCharacters			: getCharacters,
	getCharactersWithMetadata : getCharactersWithMetadata,
	getCharData				: getCharData,
	getCharName				: getCharName,

	loadBaseBlueprints		: loadBaseBlueprints,
	loadFile				: loadFile,

	calculateVolition		: ruleLibrary.calculateVolition,
	runTriggerRules			: ruleLibrary.runTriggerRules,
	ruleToEnglish			: ruleLibrary.ruleToEnglish,
	predicateToEnglish		: ruleLibrary.predicateToEnglish,
	
	dumpSocialRecord		: socialRecord.dumpSocialRecord,
	dumpActionLibrary		: actionLibrary.dumpActions,
	set						: socialRecord.set,
	get						: getSocialRecord,
	getValue				: getValue, 
	setPredicates			: setPredicates,
	setCharacterOffstage	: setCharacterOffstage,
	getIsCharacterOffstage	: getIsCharacterOffstage,
	setCharacterOnstage		: setCharacterOnstage,
	getIsCharacterOnstage	: getIsCharacterOnstage,
	setCharacterEliminated	: setCharacterEliminated,
	getIsCharacterEliminated : getIsCharacterEliminated,
	setupNextTimeStep		: socialRecord.setupNextTimeStep,
	getRegisteredDirection	: socialRecord.getRegisteredDirection,
	getAction				: actionLibrary.getAction,
	getActions				: actionLibrary.getActions,
	getAllActions			: actionLibrary.getAllActions,
	addActions				: actionLibrary.parseActions,
	addHistory				: socialRecord.addHistory,
	clearHistory			: socialRecord.clearHistory,
	getSocialRecordCopyAtTimestep	: socialRecord.getSocialRecordCopyAtTimestep,
	getSocialRecordCopy		: socialRecord.getSocialRecordCopy,
	getCurrentTimeStep		: socialRecord.getCurrentTimeStep,
	
	addRules				: addRules,
	getRules				: getRules,
	filterRules				: filterRules,
	filterActions			: filterActions,
	setRuleById				: setRuleById,
	getRuleById				: ruleLibrary.getRuleById,
	deleteRuleById			: ruleLibrary.deleteRuleById,

	setActionById			: actionLibrary.setActionById,
	doAction				: doAction,
	setSocialRecordById		: socialRecord.setById,
	

	reset					: reset,

	// validate functions
	validateRule: validate.rule,
	validateTriggerCondition: validate.triggerCondition,
	validateTriggerEffect: validate.triggerEffect,
	validateVolitionCondition: validate.volitionCondition,
	validateVolitionEffect: validate.volitionEffect,
	validateBlueprint: validate.blueprint,
	validateAction: validate.action,
};

/* test-code */
/* end-test-code */

//EXPERIMENT: don't think we want these to be public.
//addTriggerRules			: addTriggerRules,
//addVolitionRules		: addVolitionRules,

return ensembleInterface;

})();
return ensemble;
})();