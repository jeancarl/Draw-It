// Filename: public/drawit.js

angular.module('DrawItApp', [])
.controller('DrawItCtrl', ['$scope', '$http', function($scope, $http) {
  $scope.colors = [
    {name: 'Red', hex: 'FF0000'},
    {name: 'Blue', hex: '0000FF'},
    {name: 'Green', hex: '00FF00'},
    {name: 'Yellow', hex: 'FFFF00'},
    {name: 'Purple', hex: '800080'},
    {name: 'White', hex: 'FFFFFF'},
    {name: 'Black', hex: '000000'},
  ];

  $scope.history = [];

  var board = document.getElementById('board');
  var canvasWidth = 800;
  var canvasHeight = 400;
  var clickX = new Array();
  var clickY = new Array();
  var clickDrag = new Array();
  var clickColor = new Array();
  var curColor = $scope.colors[0].hex;
  var paint;

  canvas = document.createElement('canvas');
  canvas.setAttribute('width', canvasWidth);
  canvas.setAttribute('height', canvasHeight);
  canvas.setAttribute('id', 'canvas');
  canvas.setAttribute('style', 'border:1px solid black');
  board.appendChild(canvas);
  context = canvas.getContext("2d");

  $('#canvas').mousedown(function(e) {
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;
      
    paint = true;
    addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
    redraw();
  });

  $('#canvas').mousemove(function(e) {
    if(paint){
      addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
      redraw();
    }
  });

  $('#canvas').mouseup(function(e) {
    paint = false;
  });  

  $('#canvas').mouseleave(function(e) {
    paint = false;
  });

  function addClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);
    clickColor.push(curColor)
  }

  function redraw() {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
    context.lineJoin = 'round';
    context.lineWidth = 5;
        
    for(var i=0; i < clickX.length; i++) {    
      context.beginPath();
      if(clickDrag[i] && i) {
        context.moveTo(clickX[i-1], clickY[i-1]);
       } else {
         context.moveTo(clickX[i]-1, clickY[i]);
       }

       context.lineTo(clickX[i], clickY[i]);
       context.closePath();
       context.strokeStyle = '#'+clickColor[i];
       context.stroke();
    }
  }

  $scope.save = function() {
    var dataURL = canvas.toDataURL();
    $http.post('/api/upload', {image: dataURL}).then(function(response) {
      if(response.data.error) {
        alert('Error: '+response.data.error);
        return;
      }

      console.log(response);
      $scope.history.push(response.data);
    });
  }

  $scope.setColor = function(hex) {
    curColor = hex;
  }

  $scope.clearCanvas = function() {
    clickX = new Array();
    clickY = new Array();
    clickDrag = new Array();
    clickColor = new Array();

    context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
  }
}]);