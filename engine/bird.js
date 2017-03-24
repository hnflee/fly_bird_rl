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