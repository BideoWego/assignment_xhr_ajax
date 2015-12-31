var puts = function() {
  var id = (id) ? id.replace('#', '') : 'output';
  var output = document.getElementById('output');
  for (var key in arguments) {
    var arg = arguments[key];
    output.innerHTML += JSON.stringify(arg, null, 2);
    output.innerHTML += "\n";
    console.log.apply(console, arguments);
  }
};

