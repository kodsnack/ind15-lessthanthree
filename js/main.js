'use strict';

// sprites:
// img/ind15-sprites.png
// 33 x 14 px
// heart: (0, 0) w: 16, h: 14
// skull: (17, 0) w: 16, h: 14

(function(t3) {
  'use strict';
  var scene = new t3.Scene();
  var camera = new t3.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  var renderer = new t3.WebGLRenderer();
  var loader = new t3.TextureLoader();

  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( renderer.domElement );

  var helpText = 'Balance the bad comments, tap or press space to release hearts!';

  var helpDiv = document.createElement('div');
  helpDiv.className = 'helpText';
  helpDiv.textContent = helpText;
  document.body.appendChild(helpDiv);

  window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
  window.addEventListener('keypress', function (event) {
    if (event.keyCode === 32) {
      addHeart();
    }
  });
  window.addEventListener('touchend', function (event) {
    addHeart();
  });

  renderer.setClearColor(0);
  scene.fog = new t3.Fog( 0, 15, 30 );

  var skullMaterial = null;
  var heartMaterial = null;
  var bigheart = null;
  var hearts = [];
  var skulls = [];
  var removals = [];
  var running = true;

  // x and y are client position in window
  function pos2Dto3D(x, y) {
    var vector = new THREE.Vector3();
    vector.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1, 0.5);
    vector.unproject(camera);
    var dir = vector.sub(camera.position).normalize();
    var distance = -camera.position.z / dir.z;
    var pos = camera.position.clone().add(dir.multiplyScalar(distance));
    return pos;
  }

  function addHeart() {
      var x = Math.random() - 0.5;
      var y = Math.random() - 0.5;
      var heart = makeHeart([x, y, 0], [0.333, 0.333, 1]);
      heart.position.multiplyScalar(Math.random() * 10 + 5);
  }

  function makeHeart(pos, scale) {
    if (heartMaterial === null) {
      return null;
    }
    var heart = new t3.Sprite(heartMaterial);
    if (pos !== undefined) {
      heart.position.set(pos[0], pos[1], pos[2]);
    }
    if (scale !== undefined) {
      heart.scale.set(scale[0], scale[1], scale[2]);
    }
    hearts.push(heart);
    scene.add(heart);

    return heart;
  }

  function makeSkull(pos, scale) {
    if (skullMaterial === null) {
      return null;
    }
    var skull = new t3.Sprite(skullMaterial);
    if (pos !== undefined) {
      skull.position.set(pos[0], pos[1], pos[2]);
    }
    if (scale !== undefined) {
      skull.scale.set(scale[0], scale[1], scale[2]);
    }
    skulls.push(skull);
    scene.add(skull);
    return skull;
  }

  loader.load("img/skull.png", function(image) {
    image.minFilter = t3.NearestFilter;
    image.magFilter = t3.NearestFilter;
    skullMaterial = new t3.SpriteMaterial( { map: image, color: 0xffffff, fog: true } );
  });

  loader.load("img/heart.png", function(image) {
    image.minFilter = t3.NearestFilter;
    image.magFilter = t3.NearestFilter;
    heartMaterial = new t3.SpriteMaterial( { map: image, color: 0xffffff, fog: true } );
  });

  function initScene() {
    if (skullMaterial === null || heartMaterial === null) {
      return false;
    } else if (bigheart !== null) {
      return true;
    }

    // create the main heart
    bigheart = makeHeart();
    hearts.pop();
    bigheart.position.set(0, 0, 0);
    bigheart.scale.set(2,2,1);

    camera.position.z = 5;
    bigheart._basescale = new t3.Vector3(2, 2, 1);
    bigheart._gamelooper = 0.0;
    bigheart._energy = 1.0;

    return true;
  }

  function update() {
    if (!initScene()) {
      return;
    }

    var dt = 0.02;
    var rnd = Math.random();
    if (running) {
      updateSkulls(dt, rnd);
      updateHearts(dt, rnd);
      running = updateBigHeart(dt);
    }
  }

  var skullSpawnRate = 5;
  var heartSpawnRate = 2;

  function heartRadius(heart) {
    return Math.max(heart._basescale.x * heart._energy * 0.4, 0.25);
  }

  function updateSkulls(dt, rnd) {
    if (rnd > 1.0 - (skullSpawnRate * 0.01)) {
      var x = Math.random() - 0.5;
      var y = Math.random() - 0.5;
      var skull = makeSkull([x, y, 0], [0.25, 0.25, 1]);
      skull.position.normalize();
      skull.position.multiplyScalar(50);
    }

    for (var i = 0; i < skulls.length; ++i) {
      if (!updateSkull(dt, skulls[i])) {
        removals.push(i);
      }
    }

    for (var i = 0; i < removals.length; ++i) {
      var si = removals[i];
      scene.remove(skulls[si]);
      skulls[si] = null;
    }
    removals = [];
    skulls = _.reject(skulls, function(s) { return s === null; });
  }

  function updateSkull(dt, skull) {
    if (skull.position.length() < heartRadius(bigheart)) {
      bigheart._energy -= skull.scale.x * 0.1;
      return false;
    } else {
      var dir = skull.position.clone();
      dir.negate();
      dir.multiplyScalar(dt * 0.8);
      skull.position.add(dir);
    }
    return true;
  }

  function updateHearts(dt, rnd) {
    /*if (rnd > 1.0 - (heartSpawnRate * 0.01)) {
      addHeart();
    }*/

    for (var i = 0; i < hearts.length; ++i) {
      if (!updateHeart(dt, hearts[i])) {
        removals.push(i);
      }
    }

    for (var i = 0; i < removals.length; ++i) {
      var si = removals[i];
      scene.remove(hearts[si]);
      hearts[si] = null;
    }
    removals = [];
    hearts = _.reject(hearts, function(s) { return s === null; });
  }

  function updateHeart(dt, heart) {
    if (heart.position.length() < heartRadius(bigheart)) {
      bigheart._energy += heart.scale.x * 0.1;
      return false;
    } else {
      var dir = heart.position.clone();
      dir.negate();
      dir.multiplyScalar(dt * 0.8);
      heart.position.add(dir);
    }
    return true;
  }

  function updateBigHeart(dt) {
    // shrink / grow heart with number of collisions

    var energy = bigheart._energy;
    if (energy > 0 && energy < 1.5) {
      bigheart._gamelooper += dt * 5.5;
      var sv = Math.sin(bigheart._gamelooper) * 0.07;
      bigheart.scale.set(bigheart._basescale.x * energy + sv, bigheart._basescale.y * energy + sv, 1);
      bigheart.visible = true;
    } else {
      bigheart.visible = false;
      return false;
    }
    return true;
  }

  function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
  }
  initScene();
  render();

})(THREE);
