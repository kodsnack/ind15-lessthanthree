// sprites:
// img/ind15-sprites.png
// 33 x 14 px
// heart: (0, 0) w: 16, h: 14
// skull: (17, 0) w: 16, h: 14

(function(t3) {

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

  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( renderer.domElement );

  window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
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

  var tickCount = 0;

  function initScene() {
    if (skullMaterial == null || heartMaterial == null) {
      return false;
    } else if (bigheart !== null) {
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
      return;
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
      document.body.querySelector("#defend-the-internet-logo").style.display = "none";
    }

    var dt = 0.02;
    var rnd = Math.random();
    updateSkulls(dt, rnd);
    updateHearts(dt, rnd);
    updateBigHeart(dt);
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
      var skull = new Skull([x, y, 0], [0.25, 0.25, 1]);
      skull.sprite.position.normalize();
      skull.sprite.position.multiplyScalar(50);
    }

    for (var i = 0; i < skulls.length; ++i) {
      if (!updateSkull(dt, skulls[i])) {
        removals.push(i);
      }
    }

    if (removals.length > 0) {
      playFX(150 + Math.random()*150);
    }
    for (var i = 0; i < removals.length; ++i) {
      var si = removals[i];
      scene.remove(skulls[si].sprite);
      skulls[si] = null;
    }
    removals = [];
    skulls = _.reject(skulls, function(s) { return s === null; });
  }

  function updateSkull(dt, skull) {
    if (skull.sprite.position.length() < heartRadius(bigheart)) {
      bigheart._energy -= skull.sprite.scale.x * 0.1;
      return false;
    } else {
      var dir = skull.sprite.position.clone();
      dir.negate();
      dir.multiplyScalar(dt * 0.8);
      skull.sprite.position.add(dir);
    }
    return true;
  }

  function updateHearts(dt, rnd) {
    if (rnd > 1.0 - (heartSpawnRate * 0.01)) {
      var x = Math.random() - 0.5;
      var y = Math.random() - 0.5;
      var heart = new Heart([x, y, 0], [0.333, 0.333, 1]);
      heart.sprite.position.multiplyScalar(Math.random() * 10 + 5);
    }

    for (var i = 0; i < hearts.length; ++i) {
      if (!updateHeart(dt, hearts[i])) {
        removals.push(i);
      }
    }

    if (removals.length > 0) {
      playFX(350 + Math.random()*150);
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
    if (heart.sprite.position.length() < heartRadius(bigheart)) {
      bigheart._energy += heart.sprite.scale.x * 0.1;
      return false;
    } else {
      var dir = heart.sprite.position.clone();
      dir.negate();
      dir.multiplyScalar(dt * 0.2);
      heart.sprite.position.add(dir);
    }
    return true;
  }

  function updateBigHeart(dt) {
    // shrink / grow heart with number of collisions

    var energy = bigheart._energy;
    if (energy > 0) {
      bigheart._gamelooper += dt * 5.5;
      var sv = Math.sin(bigheart._gamelooper) * 0.07;
      bigheart.sprite.scale.set(bigheart._basescale.x * energy + sv, bigheart._basescale.y * energy + sv, 1);
      bigheart.sprite.visible = true;
    } else {
      bigheart.sprite.visible = false;
    }
  }

  function render() {
    window.requestAnimFrame(render);
    update();
    renderer.render(scene, camera);
  }
  initScene();
  render();

})(THREE);
