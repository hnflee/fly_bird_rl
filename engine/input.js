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