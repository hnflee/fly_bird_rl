//---------------------------
// engine.js
//---------------------------

var engine = (function() {

    var pageLoaded = false,
        preloading = true,
        assetsToLoad = 0,
        maxAssets = 0;

    return {

        env: {
            w: 0,
            h: 0,
        },

        evt: {
            onloads: [],
            progress: [],
            onload: function(func) {
                if (!pageLoaded) {
                    this.onloads.push(func);
                } else {
                    func();
                }
            }
        },

        preload: function(name) {
            if (!preloading) {
                return function() {};
            }
            maxAssets = Math.max(++assetsToLoad, maxAssets);

            return function() {
                assetsToLoad--;

                engine.evt.progress.map(function(p) {
                    return p(assetsToLoad, maxAssets);
                });

                if (assetsToLoad === 0 && pageLoaded) {
                    preloading = false;
                    engine.evt.onloads.map(function(o) {
                        o();
                    });
                }
            }
        },

        pageLoad: function() {
            pageLoaded = true;
            if (maxAssets === 0 || assetsToLoad === 0) {
                preloading = false;
                engine.evt.onloads.map(function(o) {
                    o();
                });
            }
        },

    };

}());

//---------------------------
// base.js
//---------------------------

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(engine){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  engine.Class = function(){};

  // Create a new Class that inherits from this class
  engine.Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init ) {
        this.init.apply(this, arguments);
      }
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
}(engine));

//---------------------------
// gfx.js
//---------------------------

(function(engine) {

    "use strict";

    var images = {};

    engine.gfx = {

        init: function() {
            var cn = document.createElement("canvas");
            var body = document.querySelector("body");
            body.appendChild(cn);
            cn.setAttribute("width", engine.env.w);
            cn.setAttribute("height", engine.env.h);

            var ctx = cn.getContext("2d");
            this.ctx = ctx;
        },

        drawImage: function(img, imgData, x, y) {
            this.ctx.drawImage(
                img,
                imgData.x,
                imgData.y,
                imgData.w,
                imgData.h,
                x,
                y,
                imgData.w,
                imgData.h);
        },

        loadImage: function(path, cb) {
            var cachedImage = images[path];
            if (cachedImage) {
                if (cachedImage._loaded) {
                    cb && cb(cachedImage);
                } else {
                    cachedImage.addEventListener("load", function() {
                        this._loaded = true;
                        cb && cb(cachedImage);
                    }, false);
                }
            }
            var resolve = engine.preload(path),
                image = new Image();

            image._loaded = false;
            image.src = path;

            image.addEventListener("load", function() {
                this._loaded = true;
                cb && cb(image);
                resolve();
            }, false);

            images[path] = image;
        }
    };

}(engine));

//---------------------------
// atlas.js
//---------------------------

(function(engine) {

    "use strict";

    engine.Atlas = engine.Class.extend({

        images: {},

        init: function(path) {
            var self = this;
            var xhr = new XMLHttpRequest();
            var resolve = engine.preload(path);
            xhr.onreadystatechange = function() {  
                if(xhr.readyState === 4){
                    engine.gfx.loadImage(path + ".png", function(img) {
                        self.images.main = img;
                        self.parseCSV(xhr.responseText, img);
                        resolve();
                    });
                }
            };
            xhr.open("GET", path + ".txt", true);
            xhr.send(null);
        },

        parseCSV: function(txt, img) {
            var csv = this.csv = {};
            txt.split("\n").forEach(function(line) {
                var parts = line.split(" "),
                    w = img.width,
                    h = img.height;
                csv[parts[0]] = {
                    name: parts[0],
                    w: Math.round(parseInt(parts[1], 10)),
                    h: Math.round(parseInt(parts[2], 10)),
                    x: Math.round(parts[3] * w),
                    y: Math.round(parts[4] * h)
                };
            });
        },

        render: function(name, x, y) {

            var img = this.images.main,
                imgData = this.csv[name];

            engine.gfx.drawImage(img, imgData, x, y);
        },
    });

}(engine));

//---------------------------
// physics.js
//---------------------------

(function(engine) {

    "use strict";

    engine.physics = {
        checkCollision: function(entity, entities, cbName) {
            var a = entity,
                i,
                b;

            cbName = cbName || "hit";

            for (i = 0; i < entities.length; i++) {
                b = entities[i];

                if (a !== b && 
                    a.x + a.w >= b.x &&
                    b.x + b.w >= a.x &&
                    a.y + a.h >= b.y &&
                    b.y + b.h >= a.y
                    ) {

                    a[cbName] && a[cbName]();
                    b[cbName] && b[cbName]();
                }

                
            }
        },
    }

}(engine));

//---------------------------
// sound.js
//---------------------------

(function(engine) {

    "use strict";

    var sounds = {};

    engine.Sound = engine.Class.extend({
        
        // ext: document.createElement('audio').canPlayType('audio/mpeg;') === "" ? ".ogg" : ".mp3",
        ext: ".ogg",
        
        init: function(path, volume) {
            var audio,
                resolve,
                onload;

            if (!sounds[path]) {
                audio = new window.Audio();
                resolve = engine.preload(path);
                onload = function() {
                    if (this._isload) {
                        return;
                    }
                    this._isload = true;
                    resolve();
                }

                audio.src = path.slice(-4).slice(0, 1) === "." ? path : path + this.ext;
                audio._isload = false;
                audio.addEventListener("canplaythrough", onload, false);
                audio.load();
                sounds[path] = audio;   
            }

            audio = sounds[path];
            audio.volume = volume || 1;
            audio.loop = false;
            this.audio = audio;
        },

        rewind: function() {
            this.audio.currentTime = 0;
        },

        play: function() {
            this.rewind();
            this.audio.play();
        },
    });

}(engine));

//---------------------------
// state.js
//---------------------------

(function(engine) {

    "use strict";

    engine.State = engine.Class.extend({

        init: function(state) {
            this.state = state;
            this.last = "";
            this.count = -1;
            this.locked = false;
        },

        set: function(state) {
            if (this.locked) {
                return;
            }

            this.last = this.state;
            this.state = state;
            this.count = -1;
        },

        get: function() {
            return this.state;
        },

        tick: function() {
            this.count++;
        },

        first: function() {
            return this.count === 0;
        },

        is: function(state) {
            return this.state === state;
        },

        isNot: function(state) {
            return !this.is(state);
        }

    });

}(engine));

//---------------------------
// screen.js
//---------------------------

(function (engine) {

    "use strict";

    var Screen = engine.Class.extend({
        loaded: true,
    });

    engine.Screen = Screen;

}(window.engine));


//---------------------------
// entity.js
//---------------------------

(function(engine) {
    
    "use strict";

    engine.Entity = engine.Class.extend({

        x: 0,
        y: 0,

        init: function(x, y, w, h) {
            this.x = x || this.x;
            this.y = y || this.y;
            this.w = w || this.w;
            this.h = h || this.h;
        },
    });  
    
}(engine));

//---------------------------
// bird.js
//---------------------------

(function(engine) {

    "use strict";

    engine.Bird = engine.Entity.extend({
        w: 25,
        h: 15,

        vel: 0,
        jumpVel: -8,
        maxFallVel: 8,
        gravityAc: 0.45,

        sounds: {
            "hit": new engine.Sound("res/audio/sfx_hit", 1),
            "die": new engine.Sound("res/audio/sfx_die", 1),
            "wing": new engine.Sound("res/audio/sfx_wing", 1),
            "swooshing": new engine.Sound("res/audio/sfx_swooshing", 1),
        },

        init: function(x, y, screen) {
            this._super(x, y);
            this.screen = screen;
            this.state = new engine.State("BORN");
        },

        tick: function() {
            this.state.tick();
            switch (this.state.get()) {
                case "BORN":
                    this.state.set("CRUISING");
                    break;
                case "CRUISING":
                    this.y += Math.sin(Data.now() / 150) * 0.70;
                    this.flapping = 150;
                    break;
                case "RUNNING":
                    if (this.state.first()) {
                        this.performJump();
                        this.flapping = 75;
                    }
                    var oldy = this.y;
                    this.vel = Math.min(this.vel + this.gravityAc, this.maxFallVel);
                    this.y = Math.max(5, this.y + this.vel);
                    
                    if (engine.input.pressed("jump")) {
                        this.screen.ql.teach();
                        this.performJump();
                    }

                    if (this.y > engine.env.h - 112 - this.h) {
                        this.y = oldy;
                        this.hit();
                    }
                    break;
                case "DYING":
                    this.vel = Math.min(this.vel + this.gravityAc, this.maxFallVel);
                    if (this.y < engine.env.h - 112 - this.h) {
                        this.y = Math.min(engine.env.h - 112 - this.h, this.y + this.vel);
                    }
                    break;
            }
        },

        performJump: function() {
            this.sounds.wing.play();
            this.vel = this.jumpVel;
        },

        die: function() {
            if (this.screen.state.is("RUNNING")) {
                this.screen.state.set("DYING");
                this.state.set("DYING");
                var self = this;
                setTimeout(function() {self.sounds.die.play();}, 200);
                setTimeout(function() {self.sounds.swooshing.play();}, 400);
            }
        },

        render: function() {
            engine.gfx.ctx.save();
            engine.gfx.ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            engine.gfx.ctx.rotate(Math.max(Math.atan(this.vel / this.screen.speed * 0.5), -Math.PI / 8));
            engine.gfx.ctx.translate(-this.x - this.w / 2, - this.y - this.h / 2);
            engine.game.atlas.render(
                "bird" + 0 + "_" + toggle(this.flapping, 3),
                this.x - 11,
                this.y - 17);
            engine.gfx.ctx.restore();
        },

        hit: function() {
            this.sounds.hit.play();
            this.die();
        },
    });

    function toggle(millisec, step) {
        return (Date.now() / millisec) % step >> 0;
    }

}(engine));

//---------------------------
// pipe.js
//---------------------------

(function(engine) {

    "use strict";

    engine.Pipe = engine.Entity.extend({
        init: function(group, dir, x, y, speed) {
            this._super(x, y);
            this.group = group;
            this.dir = dir;
            this.speed = speed;
            this.w = 48;
            this.h = 320;
        },

        tick: function() {
            this.x -= this.speed;
            if (this.x < -this.w) {
                this.x += (engine.env.w * 1.7) + this.w;
                this.counted = false;
            }
            return true;
        },

        render: function() {
            engine.game.atlas.render(this.dir === "up" ? "pipe_up" : "pipe_down", this.x, this.y);
        },
    })

}(engine));

//---------------------------
// titlescreen.js
//---------------------------

(function (engine, MainScreen) {

    "use strict";

    engine.TitleScreen = engine.Screen.extend({

        x: 0,
        y: 0,


        init: function () {

        },

        tick: function () {
            if (engine.input.pressed("jump")) {
                engine.game.setScreen(new engine.MainScreen());
            }
        },

        render: function () {

            var now = Date.now(),
                atlas = engine.game.atlas;

            atlas.render("bg_day", 0, 0);

            var ySin = Math.sin(now / 150) * 7;
            atlas.render("title", 55, engine.env.h * 0.18);

            atlas.render(
                "bird0_" + ((now / 100 | 0) % 3),
                engine.env.w * 0.42,
                engine.env.h * 0.38 + ySin - 5
            );

            atlas.render("land", -((now / 6 | 0) % 288), engine.env.h - 112);
            atlas.render("land", 289 - ((now / 6 | 0) % 288), engine.env.h - 112);

            atlas.render("button_play", 20, engine.env.h - 172);
            atlas.render("button_score", 152, engine.env.h - 172);
            atlas.render("button_rate", 106, engine.env.h - 242);
        }
    });

}(engine));


//---------------------------
// mainscreen.js
//---------------------------

(function(engine) {

    "use strict";

    engine.MainScreen = engine.Screen.extend({
        speed: 2,
        bird: null,
        pipes: null,

        score: 0,
        state: null,

        landOffset: 0,

        sounds: {
            "point": new engine.Sound("res/audio/sfx_point", 1),
        },

        init: function() {
            this.reset();
            this.ql = new engine.QL(this, 0.8, 1);
        },

        reset: function() {
            this.score = 0;
            this.state = new engine.State("BORN");
            this.bird = new engine.Bird(engine.env.w * 0.24, engine.env.h * 0.46, this);
            var offset = engine.env.w / 4;
            this.pipes = [
                new engine.Pipe(0, "up", offset + engine.env.w, engine.env.h - 170, this.speed),
                new engine.Pipe(0, "down", offset + engine.env.w, -100, this.speed),

                new engine.Pipe(1, "up", offset + engine.env.w * 1.6, engine.env.h - 170, this.speed),
                new engine.Pipe(1, "down", offset + engine.env.w * 1.6, -100, this.speed),

                new engine.Pipe(2, "up", offset + engine.env.w * 2.2, engine.env.h - 170, this.speed),
                new engine.Pipe(2, "down", offset + engine.env.w * 2.2, -100, this.speed),
            ];

            this.setHeight(0);
            this.setHeight(1);
            this.setHeight(2);
        },

        setHeight: function(group) {
            var h = (Math.random() * 160) + 110;
            this.pipes.filter(function(p) {
                return p.group === group;
            }).forEach(function(p) {
                p.y = p.dir === "up" ? h + 55 : h - p.h - 55;
            });
        },

        render: function() {
            var atlas = engine.game.atlas;
        
            // background
            atlas.render("bg_day", 0, 0);

            // pipes
            this.pipes.forEach(function(p) {
                p.render();
            });

            // bird
            this.bird.render();

            // land
            this.renderLand();
            
            switch (this.state.get()) {
                case "GETREADY":
                    this.renderGetReady();
                    break;
                case "RUNNING":
                    this.renderScore();
                    break;
                case "GAMEOVER":
                    this.renderGameOver();
                    break;
            }
        },

        tick: function() {
            this.state.tick();
            this.ql.tick();
            this.bird.tick();
            switch (this.state.get()) {
                case "BORN":
                    this.state.set("RUNNING");
                    this.bird.state.set("CRUSING");
                    break;
                case "RUNNING":
                    if (this.state.first()) {
                        this.bird.state.set("RUNNING");
                    }
                    this.tick_RUNNING();
                    break;
                case "DYING":
                    this.state.set("GAMEOVER");    
                    break;
                case "GAMEOVER":
                    if (this.state.first()) {
                        if (this.score > engine.game.best) {
                            engine.game.best = this.score;
                        }
                    }
                    if (engine.input.pressed("jump")) {
                        this.reset();
                    }
                    break;
            };
        },

        tick_RUNNING: function() {

            this.landOffset -= this.speed;
            if (this.landOffset < -engine.env.w) {
                this.landOffset += engine.env.w;
            }

            this.pipes = this.pipes.filter(function(p) {
                p.tick();
                if (!p.counted && p.x < this.bird.x) {
                    this.score += 0.5;
                    p.counted = true;
                    this.ql.reward(10);
                    this.sounds.point.play();
                }
                if (p.reset) {
                    this.setHeight(p.group);
                }
                return true;
            }, this);

            engine.physics.checkCollision(this.bird, this.pipes);
        },

        renderLand: function() {
            engine.game.atlas.render("land", this.landOffset, engine.env.h - 112);
            engine.game.atlas.render("land", this.landOffset + engine.env.w, engine.env.h - 112);
        },

        renderGameOver: function () {
            var atlas = engine.game.atlas;
            
            var count = this.state.count,
                yOff;

            if (count > 5) {
                yOff = Math.min(5, count - 5);
                atlas.render("text_game_over", 40, engine.env.h * 0.24 + yOff);
            }

            if (count > 20) {
                yOff = Math.max(0, 330 - (count - 20) * 20);
                atlas.render("score_panel", 24, engine.env.h * 0.38 + yOff);
                var sc = this.score + "",
                    right = 218;
                for (var i = 0; i < sc.length; i++) {
                    atlas.render("number_score_0" + sc[sc.length - i - 1], right - i * 16, 231 + yOff);
                }

                sc = engine.game.best + "";
                for (i = 0; i < sc.length; i++) {
                    atlas.render("number_score_0" + sc[sc.length - i - 1], right - i * 16, 272 + yOff);
                }

                var medal = "";
                if (this.score >= 5) medal = "3";
                if (this.score >= 10) medal = "2";
                if (this.score >= 20) medal = "1";
                if (this.score >= 30) medal = "0";
                if (medal) {
                    atlas.render("medals_" + medal, 55, 240 + yOff);
                }
            }
        },

        renderGetReady: function() {
            var atlas = engine.game.atlas;

            atlas.render("text_ready", 46, engine.env.h * 0.285);
            atlas.render("tutorial", 88, engine.env.h * 0.425);

            this.renderScore();
        },

        renderScore: function () {
            var atlas = engine.game.atlas;

            var sc = this.score + "";
            for (var i = 0; i < sc.length; i++) {
                atlas.render("font_0" + (48 + parseInt(sc[i], 10)), i * 18 + 130, engine.env.h * 0.16);
            }
        },
    });

}(engine));

//---------------------------
// input.js
//---------------------------

(function(engine) {

    var keys = {},
        actions = {};

    var input = engine.input = {
        KEYS: {
            mouse1: -1,
            touch: -6,
        },

        lastKey: null,
        lastKeyTime: Date.now(),

        init: function() {
            bindMouse();
            bindTouch();
        },

        click: function(action) {
            (actions[action] || []).some(function(code) {
                keyed(code, true);
                setTimeout(function() {
                    keyed(code, false);
                }, 100);
                return true;
            });
        },

        reset: function() {
            for (key in keys) {
                keys[key].isDown = false;
                keys[key].wasDown = false;
            }
        },

        tick: function() {
            for (key in keys) {
                keys[key].wasDown = keys[key].isDown;
            }
        },

        bind: function(action, code) {
            if (typeof action === "object") {
                codes = action;
                for (action in codes) {
                    if (Array.isArray(codes[action])) {
                        codes[action].forEach(function(code) {
                            this.bind(action, code);
                        }, this);
                    } else {
                        this.bind(action, codes[action]);
                    }
                }
                return;
            }

            code = this.KEYS[code];

            keys[code] = {
                action: action,
                isDown: false,
                wasDown: false,
            }
            if (!actions[action]) {
                actions[action] = [];
            }
            actions[action].push(code);
        },

        pressed: function(action) {
            return this.isDown(action) && !this.wasDown(action);
        },

        released: function(action) {
            return this.wasDown(action) && !this.isDown(action);
        },

        isDown: function(action) {
            return (actions[action] || []).some(function(code) {
                return keys[code].isDown;
            });
        },

        wasDown: function(action) {
            return (actions[action] || []).some(function(code) {
                return keys[code].wasDown;
            });
        },

    };

    function keyed(code, isDown) {
        if (keys[code]) {
            keys[code].wasDown = keys[code].isDown;
            keys[code].isDown = isDown;
        }
        if (isDown) {
            input.lastKey = code;
            input.lastKeyTime = Date.now();
        }
    }

    function bindMouse() {
        document.addEventListener("mousedown", function(e) {
            if (e.which === 1) {
                keyed(input.KEYS.mouse1, true); 
            }
        });

        document.addEventListener("mouseup", function(e) {
            if (e.which === 1) {
                keyed(input.KEYS.mouse1, false);
            }
        });
    }

    function bindTouch() {
        document.addEventListener("touchstart", function(e) {
            keyed(input.KEYS.touch, true);
        });

        document.addEventListener("touchend", function(e) {
            keyed(input.KEYS.touch, false);
        });
    }

}(engine));

//---------------------------
// ql.js
//---------------------------

(function(engine) {

    "use strict";

    var Q = {},
        prevState,
        prevChoice,
        curState,
        curChoice,
        teaching;
        // exploring;

    engine.QL = engine.Class.extend({
        
        startTime: Date.now(),
        
        resolution: 15,

        epoch: 0,

        init: function(screen, alpha, gamma) {
            this.screen = screen;
            this.alpha = alpha;
            this.gamma = gamma;
            prevState = null;
            prevChoice = null;
            teaching = false;
        },

        tick: function() {
            switch(this.screen.state.get()) {
                case "RUNNING":
                    this.tick_RUNNING();
                    break;
                case "DYING":
                    break;
                case "GAMEOVER":
                    if (this.screen.state.first()) {
                        this.reward(-1000);
                        this.epoch++;
                        console.log("epoch " + this.epoch + " finished at " + (Date.now() - this.startTime) / 1000 + " secs");
                        console.log("score: " + this.screen.score);
                        if (teaching) {
                            console.log("teaching: " + teaching);
                        }
                        teaching = false;
                    }
                    this.screen.reset();
                    break;
            }
        },

        teach: function() {
            prevChoice = 1;
            teaching = true;
        },

        tick_RUNNING: function() {
            curState = this.getState();
            curChoice = 0;

            if (prevState === null || prevChoice === null) {
                prevChoice = curChoice;
                prevState = curState;
                return;
            }

            this.reward(1);

            for (var k in (Q[curState] || [])) {
                if (Q[curState][curChoice] < Q[curState][k]) {
                    curChoice = parseInt(k);
                }
            }

            if (curChoice === 1 && !teaching) {
                this.screen.bird.performJump();
            }
            prevChoice = curChoice;
            prevState = curState;
        },

        reward: function(r) {
            var fr = 0;

            for (var k in (Q[curState] || [])) {
                if (fr < Q[curState][k]) {
                    fr = Q[curState][k];
                }
            }

            if (!Q[prevState]) {
                Q[prevState] = [0, 0];
            }

            Q[prevState][prevChoice] += this.alpha * (r + this.gamma * fr - Q[prevState][prevChoice]);
        },

        getState: function() {
            var pipes = this.screen.pipes,
                bird = this.screen.bird,
                dx1 = 99999,
                dy1 = 99999,
                dx2 = 99999,
                dy2 = 99999;

            pipes.forEach(function(p) {
                if (p.dir === "up") {
                    if (bird.x <= p.x + p.w && dx1 > p.x + p.w - bird.x) {
                        dx1 = p.x + p.w - bird.x;
                        dy1 = bird.y - p.y;
                    }
                }
            });

            pipes.forEach(function(p) {
                if (p.dir === "up") {
                    if (bird.x <= p.x + p.w && dx2 > p.x + p.w - bird.x && dx1 < p.x + p.w - bird.x) {
                        dx2 = p.x + p.w - bird.x;
                        dy2 = bird.y - p.y;
                    }
                }
            });

            dx1 = Math.floor(dx1 / this.resolution) * this.resolution;
            dy1 = Math.floor(dy1 / this.resolution) * this.resolution;

            dx2 = Math.floor(dx2 / this.resolution) * this.resolution;
            dy2 = Math.floor(dy2 / this.resolution) * this.resolution;

            return dx1 + "," + dy1 + "," + dx2 + "," + dy2;
        },
    });

}(engine));

//---------------------------
// game.js
//---------------------------

(function(engine) {

    "use strict";

    engine.Game = engine.Class.extend({

        atlas: new engine.Atlas('res/flappyAtlas/atlas'),

        preset_dt: 1 / 60,
        accumulator: 0,
        running: false,

        best: 0,

        init: function(w, h) {
            var self = this;
            engine.game = this;
            engine.env.w = w;
            engine.env.h = h;

            engine.gfx.init();
            engine.input.init();

            engine.evt.progress.push(function(remain, max) {
                console.log("loding " + (max - remain) + " / " + max);
            });

            window.addEventListener("load", function() {
                engine.pageLoad();
            }, false);

            this.running = true;
            this.lastTime = Date.now();

            engine.evt.onload(function() {
                self.load();
                self.run();
            });
        },

        run: function() {

            var self = this,
                now = Date.now(),
                frameTime = Math.min((now - this.lastTime) / 1000, this.preset_dt),
                c;

            this.lastTime = now;
            this.accumulator += frameTime;

            if (this.running) {
                while (this.accumulator >= this.preset_dt) {
                    c++;
                    this.accumulator -= this.preset_dt;
                    this.tick(this.preset_dt);
                }
                this.render();
            }

            window.requestAnimationFrame(function() {
                self.run();
            });
        },

        tick: function(delta) {
            this.time += delta;
            this.screen.loaded && this.screen.tick();
            engine.input && engine.input.tick();
        },

        render: function() {
            this.screen.loaded && this.screen.render();
        },

        setScreen: function(screen) {
            this.screen = screen;
        },

        load: function() {
            engine.input.bind({
                "jump": ["mouse1", "touch"],
            });
            this.setScreen(new engine.TitleScreen());
        }
    })

}(engine));

