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