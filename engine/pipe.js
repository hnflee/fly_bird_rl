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