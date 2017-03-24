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