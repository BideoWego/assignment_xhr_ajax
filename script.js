"use strict";

// $ constructor
var $ = function $(options) {
  // return a new instance 
  // if not instantiated
  if (!(this instanceof $)) {
    return new $(options);
  }
};

// recursively serialize an object into a query string
$.serialize = function(object, prefix) {
  var str = [];
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
      if (typeof value === 'object') {
        // if the value is an object
        // serialize it recursively
        // use the current key as prefix
        encoded = $.serialize(value, key);
      } else {
        // otherwise url encode the key value pair
        key = encodeURIComponent(key);
        value = encodeURIComponent(value);
        // join with =
        encoded = key + '=' + value;
      }
      // push to array
      str.push(encoded);
    }
  }
  // join all params with separating &
  return str.join('&');
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
$.get = function() {};

// post
$.post = function() {};

