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