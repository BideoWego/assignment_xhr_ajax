"use strict";

var $ = (function() {

  // ----------------------------------------
  // Constructor
  // ----------------------------------------
  var $ = function $(options) {
    // return new instance
    // unless instantiated
    if (!(this instanceof $)) {
      return new $(options);
    }
  };

  // ----------------------------------------
  // $.deserialize helper methods
  // ----------------------------------------
  // returns true if the
  // string is only digits
  var _isInteger = function(str) {
    return !!str.match(/^\d+$/);
  };

  // remove surrounding brackets from
  // query string keys
  var _removeBrackets = function(keys) {
    var noBrackets = [];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      key = key.match(/^\[(.+)\]$/)[1];
      noBrackets.push(key);
    }
    return noBrackets;
  };

  // convert an array to
  // an object
  var _arrayToObject = function(array) {
    var object = {};
    for (var key in array) {
      object[key] = array[key];
    }
    return object;
  };

  // creates an array or object
  // at the next key in keys
  // if it exists
  // if the next key is not an
  // integer the value at
  // current key is casted to
  // an object
  var _initializeNextKey = function(object, keys, currentKey, currentIndex) {
    var nextKey = keys[currentIndex + 1]; 
    if (nextKey) {
      if (!object[currentKey]) {
        object[currentKey] = (_isInteger(nextKey)) ? [] : {};
      }
      if (Array.isArray(object[currentKey]) &&
          !_isInteger(nextKey)) {
        object[currentKey] = _arrayToObject(object[currentKey]);
      }
    }
  };

  // returns an array where
  // index 0 is the decoded key
  // and index 1 is the decoded value
  // value is parsed as an integer
  // if it is a string of only integers
  var _getDecodedParamPair = function(pair) {
    pair = pair.split('=');
    pair[0] = decodeURIComponent(pair[0]);
    pair[1] = decodeURIComponent(pair[1] || '');
    if (_isInteger(pair[1])) {
      pair[1] = parseInt(pair[1]);
    }
    return pair;
  };

  // sets the appropriate
  // nested structure
  // given the keys
  // and sets the value
  // at the final key
  // on the given object
  var _setNestedKeyValue = function(object, keys, value) {
    var depth = object;
    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      _initializeNextKey(depth, keys, key, j);
      if (j === keys.length - 1) {
        depth[key] = value;
      } else {
        depth = depth[key];
      }
    }
  };

  // sets the key on the
  // given object to value
  // casts the key to an integer
  // if appropriate
  // and removes empty brackets from
  // the key
  var _setKeyValue = function(object, key, value) {
    key = (key.indexOf('[]') > -1) ? key.slice(0, -2) : key;
    key = (_isInteger(key)) ? parseInt(key) : key;
    object[key] = value;
  };

  // returns an array of nested keys
  // from the given key
  var _getNestedKeys = function(key) {
    var firstKey = key.split('[')[0];
    var keys = key.match(/\[([^\[\]]+)\]/g);
    keys = (keys) ? keys : [];
    keys.unshift('[' + firstKey + ']');
    keys = _removeBrackets(keys);
    return keys;
  };

  // returns an object
  // that represents the given
  // array of query string
  // key value pairs
  var _objectify = function(pairs) {
    var result = {};
    for (var i = 0; i < pairs.length; i++) {
      var pair = _getDecodedParamPair(pairs[i]);
      var key = pair[0];
      var value = pair[1];
      var keys = _getNestedKeys(key);
      if (keys.length > 1) {
        _setNestedKeyValue(result, keys, value);
      } else {
        _setKeyValue(result, key, value);
      }
    }
    return result;
  };

  // ----------------------------------------
  // Deserialize a query string into JSON
  // ----------------------------------------
  $.deserialize = function(query) {
    query = query || window.location.search.slice(1);
    var pairs = query.split('&');
    var result = _objectify(pairs);
    return JSON.parse(JSON.stringify(result));
  };

  // ----------------------------------------
  // $.serialize helper methods
  // ----------------------------------------
  // returns an encoded query string
  // from the key value pair
  var _getEncodedParamPair = function(key, value) {
    key = encodeURIComponent(key);
    value = encodeURIComponent(value);
    return key + '=' + value;
  };

  // serializes the object
  // into a query string recursively
  var _recursiveSerialize = function(object, prefix) {
    var params = [];
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        var key = (prefix) ? prefix + '[' + property + ']' : property;
        var value = object[property];
        var encoded;
        if (typeof value === 'object') {
          if ((Array.isArray(value) && value.length > 0) ||
              (Object.keys(value).length > 0)) {
            encoded = _recursiveSerialize(value, key);
          } else {
            encoded = key + '[]';
          }
        } else {
          encoded = _getEncodedParamPair(key, value);
        }
        params.push(encoded);
      }
    }
    return params.join('&');
  };

  // ----------------------------------------
  // Serialize a JSON object into a query string
  // ----------------------------------------
  $.serialize = function(object) {
    return _recursiveSerialize(object);
  };

  // ----------------------------------------
  // $.ajax helper methods
  // ----------------------------------------
  // ensures that the url
  // is properly set on
  // options
  var _setAJAXOptions = function(url, options) {
    if (typeof url === 'object') {
      options = url;
      url = options['url'];
    }

    if (url === undefined) {
      url = window.location.href;
    }
    options['url'] = url;

    return options;
  };

  // ----------------------------------------
  // Make a general AJAX request
  // ----------------------------------------
  $.ajax = function(url, options) {
    options = _setAJAXOptions(url, options);

    var context = (options['context']) ? options['context'] : options;
    var method = (options['method']) ? options['method'] : 'GET';
    var async = (options['async']) ? options['async'] : true;

    var complete = (options['complete']) ? options['complete'] : function(){};
    var success = (options['success']) ? options['success'] : function(){};
    var error = (options['error']) ? options['error'] : function(){};

    var data = (options['data']) ? options['data'] : null;
    if (data && typeof data !== 'string') {
      data = $.serialize(data);
    }

    var status;
    
    var xhr = new XMLHttpRequest();

    xhr.addEventListener('error', function(e) {
      status = 'error';
      error.call(context, xhr, status, xhr.statusText);
      complete.call(context, xhr, status);
    });

    xhr.addEventListener('load', function(e) {
      if (xhr.status >= 200 && xhr.status < 300) {
        status = 'success';
        success.call(context, xhr.responseText, status, xhr);
      } else {
        status = 'error';
        error.call(context, xhr, status, xhr.statusText);
      }
      complete.call(context, xhr, status);
    });

    var url = (method === 'GET') ? options['url'] + '?' + data : options['url'];

    xhr.open(method, url, async);

    if (method &&
        method.toUpperCase() === 'POST') {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }

    xhr.send(data);
  };

  // ----------------------------------------
  // Make a GET request
  // ----------------------------------------
  $.get = function(url, data, success, dataType) {
    var options;
    if (typeof url === 'object') {
      options = url;
      url = options['url'];
    } else {
      options = {
        url: url,
        data: data,
        success: success,
        dataType: dataType,
        method: 'GET'
      };
    }
    $.ajax(options);
  };

  // ----------------------------------------
  // Make a POST request
  // ----------------------------------------
  $.post = function(url, data, success, dataType) {
    var options;
    if (typeof url === 'object') {
      options = url;
      url = options['url'];
    } else {
      options = {
        url: url,
        data: data,
        success: success,
        dataType: dataType,
        method: 'POST'
      };
    }
    $.ajax(options);
  };

  return $;

})();

