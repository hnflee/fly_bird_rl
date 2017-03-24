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
                    this.ql.reward(50);
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