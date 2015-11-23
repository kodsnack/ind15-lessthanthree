// sprites:
// img/ind15-sprites.png
// 33 x 14 px
// heart: (0, 0) w: 16, h: 14
// skull: (17, 0) w: 16, h: 14

(function(t3) {

  // keyboard state
  // adapted from http://learningthreejs.com/data/THREEx/docs/THREEx.KeyboardState.html
  // usage:
  // var keyboard = new KeyboardState();
  // This will return true if shift and A are pressed, false otherwise
  // keyboard.pressed("shift+A")
  // stop listening to the keyboard
  // keyboard.destroy()
  var KeyboardState = function() {
    this.keyCodes = {};
    this.modifiers = {};
    var self = this;
    this._onKeyDown = function(event){ self._onKeyChange(event, true); };
    this._onKeyUp = function(event){ self._onKeyChange(event, false);};
    document.addEventListener("keydown", this._onKeyDown, false);
    document.addEventListener("keyup", this._onKeyUp, false);
    this.MODIFIERS  = ['shift', 'ctrl', 'alt', 'meta'];
    this.ALIAS  = {
      'left'    : 37,
      'up'      : 38,
      'right'   : 39,
      'down'    : 40,
      'space'   : 32,
      'pageup'  : 33,
      'pagedown': 34,
      'tab'     : 9
    };
  };
  KeyboardState.prototype.destroy = function() {
    document.removeEventListener("keydown", this._onKeyDown, false);
    document.removeEventListener("keyup", this._onKeyUp, false);
  };
  KeyboardState.prototype._onKeyChange  = function(event, pressed) {
    var keyCode = event.keyCode;
    this.keyCodes[keyCode] = pressed;
    this.modifiers['shift'] = event.shiftKey;
    this.modifiers['ctrl'] = event.ctrlKey;
    this.modifiers['alt'] = event.altKey;
    this.modifiers['meta'] = event.metaKey;
  };
  KeyboardState.prototype.pressed = function(keyDesc) {
    var keys  = keyDesc.split("+");
    for (var i = 0; i < keys.length; i++) {
      var key   = keys[i];
      var pressed;
      if (KeyboardState.MODIFIERS.indexOf(key) !== -1) {
        pressed = this.modifiers[key];
      } else if (Object.keys(KeyboardState.ALIAS).indexOf(key) != -1) {
        pressed = this.keyCodes[KeyboardState.ALIAS[key]];
      } else {
        pressed = this.keyCodes[key.toUpperCase().charCodeAt(0)];
      }
      if (!pressed) {
        return false;
      }
    };
    return true;
  };

  var scene = new t3.Scene();
  var camera = new t3.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  var renderer = new t3.WebGLRenderer();

  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( renderer.domElement );

  window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  var skullTexture = t3.ImageUtils.loadTexture( "img/skull.png" );
  skullTexture.minFilter = t3.NearestFilter;
  skullTexture.magFilter = t3.NearestFilter;
  var skullMaterial = new t3.SpriteMaterial( { map: skullTexture, color: 0xffffff, fog: true } );
  var skull = new t3.Sprite( skullMaterial );
  scene.add( skull );

  var heartTexture = t3.ImageUtils.loadTexture( "img/heart.png" );
  heartTexture.minFilter = t3.NearestFilter;
  heartTexture.magFilter = t3.NearestFilter;
  var heartMaterial = new t3.SpriteMaterial( { map: heartTexture, color: 0xffffff, fog: true } );
  var heart = new t3.Sprite( heartMaterial );
  scene.add( heart );

  renderer.setClearColor(0x222428);
  scene.fog = new t3.Fog( 0x222428, 15, 30 );

  var player = {
    sprite: {}
  };
  var hearts = [];
  var skulls = [];

  function initScene() {
    _.each([skull, heart], function(sprite) {
      var x = Math.random() - 0.5;
	    var y = Math.random() - 0.5;
	    var z = Math.random() - 0.5;
      var radius = 10.0;

      sprite.position.set( x, y, z );
		  sprite.position.normalize();
		  sprite.position.multiplyScalar( radius );

    });
  }

  function updateSpawns() {
  }

  var cameralooper = 0.0;
  camera.position.z = 5;

  // player heart
  // other hearts
  // enemy skulls
  // spawnHeart() - once in a while, spawn new hearts
  // spawnSkull() - once in a while, spawn new skulls
  // hearts and skulls need a lifetime..
  // updateHearts()
  // updateSkulls()
  // updatePlayer()

  function updatePlayer() {
    cameralooper += 0.05;
    camera.position.z = 10.0 + Math.sin(cameralooper) * 5.0;
  }

  function render() {
    requestAnimationFrame(render);
    updateSpawns();
    updatePlayer();
    renderer.render(scene, camera);
  }
  initScene();
  render();

})(THREE);
