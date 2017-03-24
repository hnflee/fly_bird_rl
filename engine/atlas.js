(function(engine) {

    "use strict";

    engine.Atlas = engine.Class.extend({

        images: {},

        init: function(path) {
            var self = this;
            var xhr = new XMLHttpRequest();
            var resolve = engine.preload(path);
            xhr.onreadystatechange = function() {  
                if(xhr.readyState === 4){
                    engine.gfx.loadImage(path + ".png", function(img) {
                        self.images.main = img;
                        self.parseCSV(xhr.responseText, img);
                        resolve();
                    });
                }
            };
            xhr.open("GET", path + ".txt", true);
            xhr.send(null);
        },

        parseCSV: function(txt, img) {
            var csv = this.csv = {};
            txt.split("\n").forEach(function(line) {
                var parts = line.split(" "),
                    w = img.width,
                    h = img.height;
                csv[parts[0]] = {
                    name: parts[0],
                    w: Math.round(parseInt(parts[1], 10)),
                    h: Math.round(parseInt(parts[2], 10)),
                    x: Math.round(parts[3] * w),
                    y: Math.round(parts[4] * h)
                };
            });
        },

        render: function(name, x, y) {

            var img = this.images.main,
                imgData = this.csv[name];

            engine.gfx.drawImage(img, imgData, x, y);
        },
    });

}(engine));