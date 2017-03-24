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
        
        resolution: 20,

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
                dx = 99999,
                dy = 99999;

            pipes.forEach(function(p) {
                if (p.dir === "up") {
                    if (bird.x <= p.x + p.w && dx > p.x + p.w - bird.x) {
                        dx = p.x + p.w - bird.x;
                        dy = bird.y - p.y;
                    }
                }
            });

            dx = Math.floor(dx / this.resolution) * this.resolution;
            dy = Math.floor(dy / this.resolution) * this.resolution;

            return dx + "," + dy;
        },
    });

}(engine));