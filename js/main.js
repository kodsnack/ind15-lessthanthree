'use strict';

// sprites:
// img/ind15-sprites.png
// 33 x 14 px
// heart: (0, 0) w: 16, h: 14
// skull: (17, 0) w: 16, h: 14

(function(t3) {
  'use strict';

  // setup WebAudio
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audio = new AudioContext();

  window.requestAnimFrame = (function(){
    return window.requestAnimationFrame  ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function( callback ){
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  var scene = new t3.Scene();
  var camera = new t3.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  var renderer = new t3.WebGLRenderer();
  var loader = new t3.TextureLoader();
  var shakeVector = new t3.Vector3(0, 0, 0);

  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( renderer.domElement );

  var helpText = 'Balance the bad comments, tap or press space to release hearts!';

  var helpDiv = document.createElement('div');
  helpDiv.id = 'helpText';
  helpDiv.className = 'helpText';
  helpDiv.textContent = helpText;
  helpDiv.addEventListener('touchend', restart);
  helpDiv.addEventListener('click', restart);
  document.body.appendChild(helpDiv);

  window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });
  window.addEventListener('keypress', function (event) {
    if (event.keyCode === 32) {
      addHeart();
      playFX(600 + Math.random()*30);
    }
  });
  window.addEventListener('touchend', function (event) {
    addHeart();
    playFX(600 + Math.random()*30);
  });

  renderer.setClearColor(0);
  scene.fog = new t3.Fog( 0, 15, 30 );

  function playFX(freq) {
    var peakGain = 0.5;
    var rampUp = 0.1;
    var rampDown = 0.3;

    var source = audio.createOscillator();
    source.frequency.value = freq;

    var real = new Float32Array([0,0.4,0.4,1,1,1,0.3,0.7,0.6,0.5,0.9,0.8]);
    var imag = new Float32Array(real.length);
    var hornTable = audio.createPeriodicWave(real, imag);

    source.setPeriodicWave(hornTable);

    var gain = audio.createGain();
    source.connect(gain);
    gain.connect(audio.destination);

    var now = audio.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(peakGain, now + rampUp);
    gain.gain.exponentialRampToValueAtTime(0.1, now + rampDown);

    //source.connect(audio.destination);
    source.start(0);

    setTimeout(function() {
      source.stop(0);
      source.disconnect();
    }, (rampUp + rampDown) * 1000);
  }

  var skullMaterial = null;
  var heartMaterial = null;
  var bigheart = null;
  var hearts = [];
  var skulls = [];
  var removals = [];
  var running = true;

  function restart() {
    document.getElementById('helpText').textContent = helpText;
    bigheart.sprite.scale.set(2,2,1);
    bigheart._basescale = new t3.Vector3(2, 2, 1);
    bigheart._gamelooper = 0.0;
    bigheart._energy = 1.0;
    bigheart.sprite.visible = true;
    running = true;
  }

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
      var heart = new Heart([x, y, 0], [0.333, 0.333, 1]);
      heart.sprite.position.multiplyScalar(Math.random() * 10 + 5);
  }

  function Heart(pos, scale) {
    if (heartMaterial === null) {
      return null;
    }
    this.sprite = new t3.Sprite(heartMaterial);
    if (pos !== undefined) {
      this.sprite.position.set(pos[0], pos[1], pos[2]);
    }
    if (scale !== undefined) {
      this.sprite.scale.set(scale[0], scale[1], scale[2]);
    }
    this.live = true;
    this.outrotime = 0;
    hearts.push(this);
    scene.add(this.sprite);

    return this;
  }

  function Skull(pos, scale) {
    if (skullMaterial === null) {
      return null;
    }
    this.sprite = new t3.Sprite(skullMaterial);
    if (pos !== undefined) {
      this.sprite.position.set(pos[0], pos[1], pos[2]);
    }
    if (scale !== undefined) {
      this.sprite.scale.set(scale[0], scale[1], scale[2]);
    }
    this.live = true;
    this.outrotime = 0;
    skulls.push(this);
    scene.add(this.sprite);
    return this;
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

  function screenShake(amount) {
    var shakeOffset = new t3.Vector3(Math.random() * amount, Math.random() * amount, Math.random() * amount);
    shakeVector.add(shakeOffset);
  }

  function updateScreenShake(dt) {
    var basePosition = new t3.Vector3(0, 0, 5);
    basePosition.add(shakeVector);
    console.log(basePosition);
    camera.position.copy(basePosition);
    shakeVector.set(Math.random() * shakeVector.x,
                    Math.random() * shakeVector.y,
                    Math.random() * shakeVector.z);
  }

  var tickCount = 0;

  function initScene() {
    if (skullMaterial === null || heartMaterial === null) {
      return false;
    }
    if (bigheart !== null) {
      return true;
    }

    // create the main heart
    bigheart = new Heart();
    hearts.pop();
    bigheart.sprite.position.set(0, 0, 0);
    bigheart.sprite.scale.set(2,2,1);

    camera.position.z = 5;
    bigheart._basescale = new t3.Vector3(2, 2, 1);
    bigheart._gamelooper = 0.0;
    bigheart._energy = 1.0;

    tickCount = 0;

    return true;
  }

  function update() {
    if (!initScene()) {
      return false;
    }

    tickCount += 1;
    if (tickCount == 10) {
      var text2 = document.createElement('div');
      text2.id = "defend-the-internet-logo";
      text2.style.position = 'absolute';
      text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
      text2.style.height = "100px";
      text2.style.width = "100%";
      text2.style.display = "block";
      text2.style.fontFamily = "sans";
      text2.style.fontWeight = "bold";
      text2.style.fontSize = "80px";
      text2.style.backgroundColor = "white";
      text2.style.color = "black";
      text2.style.textAlign = "center";
      text2.innerHTML = "DEFEND THE INTERNET!";
      text2.style.top = ((window.innerHeight / 2) - 100) + 'px';
      text2.style.left = 0;
      document.body.appendChild(text2);
    }

    if (tickCount >= 80) {
      var logo = document.body.querySelector("#defend-the-internet-logo");
      if (logo.className != 'hidden') {
        logo.className = 'hidden';
      }
    }

    var dt = 0.02;
    var rnd = Math.random();
    if (running) {
      updateSkulls(dt, rnd);
      updateHearts(dt, rnd);
      updateScreenShake(dt);
      running = updateBigHeart(dt);
      return true;
    } else {
      return false;
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
      var skull = new Skull([x, y, 0.1], [0.25, 0.25, 1]);
      skull.sprite.position.normalize();
      skull.sprite.position.multiplyScalar(50);
    }

    skulls.forEach(function (skull, index) {
      if (!updateSkull(dt, skulls[index])) {
        removals.push(index);
      }
    });

    if (removals.length > 0) {
      playFX(150 + Math.random()*150);
      screenShake(rnd * 0.5);
    }

    removals.forEach(function (removal) {
      scene.remove(skulls[removal].sprite);
      skulls[removal] = null;
    });
    removals = [];
    skulls = _.reject(skulls, function(s) { return s === null; });
  }

  function updateSkull(dt, skull) {
    if (skull.live == false) {
      skull.outrotime += dt * 2;
      skull.sprite.scale.x -= dt * 2;
      skull.sprite.scale.y -= dt * 2;
      //skull.sprite.position.z -= dt * 500;
      if (skull.outrotime > 1.0) {
        return false;
      }
    } else if (skull.sprite.position.length() < heartRadius(bigheart)) {
      skull.live = false;
      bigheart._energy -= skull.sprite.scale.x * 0.1;
    } else {
      var dir = skull.sprite.position.clone();
      dir.negate();
      dir.multiplyScalar(dt * 0.8);
      skull.sprite.position.add(dir);
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

    if (removals.length > 0) {
      playFX(350 + Math.random()*150);
      screenShake(rnd * 0.25);
    }
    for (var i = 0; i < removals.length; ++i) {
      var si = removals[i];
      scene.remove(hearts[si].sprite);
      hearts[si] = null;
    }
    removals = [];
    hearts = _.reject(hearts, function(s) { return s === null; });
  }

  function updateHeart(dt, heart) {
    if (heart.live == false) {
      heart.outrotime += dt * 2;
      heart.sprite.scale.x -= dt * 2;
      heart.sprite.scale.y -= dt * 2;
      heart.sprite.rotation.z += dt * 360;
      if (heart.outrotime > 1.0) {
        return false;
      }
    } else if (heart.sprite.position.length() < heartRadius(bigheart)) {
      heart.live = false;
      bigheart._energy += heart.sprite.scale.x * 0.1;
    } else {
      var dir = heart.sprite.position.clone();
      dir.negate();
      dir.multiplyScalar(dt * 0.8);
      heart.sprite.position.add(dir);
    }
    return true;
  }

  function updateBigHeart(dt) {
    // shrink / grow heart with number of collisions

    var energy = bigheart._energy;
    if (energy > 0 && energy < 1.5) {
      bigheart._gamelooper += dt * 5.5;
      var sv = Math.sin(bigheart._gamelooper) * 0.07;
      bigheart.sprite.scale.set(bigheart._basescale.x * energy + sv, bigheart._basescale.y * energy + sv, 1);
      bigheart.sprite.visible = true;
    } else {
      bigheart.sprite.visible = false;
      document.getElementById('helpText').textContent = 'Restart';
      return false;
    }
    return true;
  }

  function render() {
    window.requestAnimFrame(render);
    update();
    renderer.render(scene, camera);
  }
  initScene();
  render();

})(THREE);
