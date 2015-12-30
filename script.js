"use strict";

// $ constructor
var $ = function $(options) {
  // return a new instance 
  // if not instantiated
  if (!(this instanceof $)) {
    return new $(options);
  }
};

// just for fun...
// doesn't handle nested values (yet)
$.deserialize = function(queryString) {
  queryString = queryString || window.location.search.slice(1);

  // get param key value pairs
  var pairs = queryString.split('&');

  // initialize return value
  var result = {};

  for (var i = 0; i < pairs.length; i++) {
    // decode the key value pairs
    var pair = pairs[i].split('=');
    var key = decodeURIComponent(pair[0]);
    var value = decodeURIComponent(pair[1] || '');

    // assume integer strings
    // should be parsed as integers
    value = (value.match(/^\d+$/)) ? parseInt(value) : value;

    // get top level key
    var prefix = key.split('[')[0];

    // get nested keys
    var matches = key.match(/\[([^\[\]]+)\]/g);

    if (matches) {
      // prepend first key
      // before nested keys
      matches.unshift('[' + prefix + ']');

      // set object for
      // recursive iteration
      // at top level
      var object = result;
      for (var j = 0; j < matches.length; j++) {
        // key index without brackets
        var index = matches[j].match(/^\[(.+)\]$/)[1];

        // check if there
        // is a next nested
        // key
        var nextIndex = matches[j + 1];
        if (nextIndex) {
          // if there is remove the brackets
          nextIndex = nextIndex.match(/^\[(.+)\]$/)[1];

          // if the current
          // index doesn't
          // exist create it
          if (!object[index]) {
            // if the next index
            // is an integer
            // create an array
            // else create an object
            object[index] = (nextIndex.match(/^\d+$/)) ? [] : {};
          }

          // if the object at index
          // is an array
          // and next index is an integer
          if (Array.isArray(object[index]) &&
              !nextIndex.match(/^\d+$/)) {
            // then reset the index
            // as an object
            var o = {};
            for (var k in object[index]) {
              o[k] = object[index][k];
            }
            object[index] = o;
          }
        }

        // if we're on the last index
        if (j === matches.length - 1) {
          if (Array.isArray(object)) {
            // push if we can
            object.push(value);
          } else {
            // else set value by key
            object[index] = value;
          }
        } else {
          // if there are still nested
          // keys
          // tunnel down to the next level
          // for the next iteration
          // simulating recursion
          object = object[index];
        }
      }
    } else {
      // remove brackets from end of key
      // if present
      key = (key.indexOf('[]') > -1) ? key.replace('[]', '') : key;

      // if key is only integers
      // parse it as an integer
      key = (key.match(/^\d+$/)) ? parseInt(key) : key;
      result[key] = value;
    }
  }
  // return JSON object
  return JSON.parse(JSON.stringify(result));
};

// recursively serialize an object into a query string
$.serialize = function(object, prefix) {
  var params = [];
  for (var property in object) {
    if (object.hasOwnProperty(property)) {
      var key;

      // always set a usable value
      var value = object[property];

      // if we have a prefix
      if (prefix) {
        // it is a nested value
        // wrap property as key
        key = prefix + '[' + property + ']';
      } else {
        // if not is it a normal key
        key = property;
      }

      var encoded;
      // if the value is an object
      if (typeof value === 'object') {
        // and it has values
        if ((Array.isArray(value) && value.length > 0) ||
            (Object.keys(value).length > 0)) {
          // serialize it recursively
          // use the current key as prefix
          encoded = $.serialize(value, key);
        } else {
          // if object is empty
          // represent it with key[]
          // so server creates an emtpy array
          encoded = key + '[]';
        }
      } else {
        // otherwise url encode the key value pair
        key = encodeURIComponent(key);
        value = encodeURIComponent(value);

        // join with =
        encoded = key + '=' + value;
      }
      // push to array
      params.push(encoded);
    }
  }
  // join all params with separating &
  return params.join('&');
};

// ajax
$.ajax = function(url, options) {
  // if the url is an object
  if (typeof url === 'object') {
    // use it as the options object
    options = url;
    // set the url from options
    url = options['url'];
  }

  // if url was not defined
  if (url === undefined) {
    // it defaults to the current page
    url = window.location.href;
  }

  // set the value of this
  var context = (options['context']) ? options['context'] : options;

  // initialize the xhr
  var xhr = new XMLHttpRequest();

  // set method
  var method = (options['method']) ? options['method'] : 'GET';

  // set async
  var async = (options['async']) ? options['async'] : true;

  // set the complete callback
  var complete;
  if (options['complete']) {
    complete = options['complete'];
  } else {
    complete = function(){};
  }

  // hoist internal status
  var status;

  // set error callback
  var error;
  if (options['error']) {
    error = options['error'];
  } else {
    error = function(){};
  }
  xhr.addEventListener('error', function(e) {
    status = 'error';
    error.call(context, xhr, status, xhr.statusText);
    complete.call(context, xhr, status);
  });

  // set the success callback
  var success;
  if (options['success']) {
    success = options['success'];
  } else {
    success = function(){};
  }
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

  // set data
  var data = (options['data']) ? options['data'] : null;
  if (data && typeof data !== 'string') {
    data = $.serialize(data);
  }

  // if method is GET
  // append data as query string
  if (method === 'GET') {
    url += '?' + data;
  }

  // open the connection
  xhr.open(method, url, async);

  // set POST headers
  if (method &&
      method.toUpperCase() === 'POST') {
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  }

  // send
  xhr.send(data);
};

// get
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

// post
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

