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