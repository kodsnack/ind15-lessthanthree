(function(t3) {

  var scene = new t3.Scene();
  var camera = new t3.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  var renderer = new t3.WebGLRenderer();

  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );


  var geometry = new t3.BoxGeometry( 1, 1, 1 );
  var material = new t3.MeshBasicMaterial( { color: 0xf02222 } );
  var cube = new t3.Mesh( geometry, material );
  scene.add( cube );

  camera.position.z = 5;

  function render() {
    requestAnimationFrame(render);

    cube.rotation.x += 0.1;
    cube.rotation.y += 0.1;

    renderer.render(scene, camera);
  }
  render();

})(THREE);
