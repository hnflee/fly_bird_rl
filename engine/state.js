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