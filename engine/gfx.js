(function(engine) {

    "use strict";

    var images = {};

    engine.gfx = {

        init: function() {
            var cn = document.createElement("canvas");
            var body = document.querySelector("body");
            body.appendChild(cn);
            cn.setAttribute("width", engine.env.w);
            cn.setAttribute("height", engine.env.h);

            var ctx = cn.getContext("2d");
            this.ctx = ctx;
        },

        drawImage: function(img, imgData, x, y) {
            this.ctx.drawImage(
                img,
                imgData.x,
                imgData.y,
                imgData.w,
                imgData.h,
                x,
                y,
                imgData.w,
                imgData.h);
        },

        loadImage: function(path, cb) {
            var cachedImage = images[path];
            if (cachedImage) {
                if (cachedImage._loaded) {
                    cb && cb(cachedImage);
                } else {
                    cachedImage.addEventListener("load", function() {
                        this._loaded = true;
                        cb && cb(cachedImage);
                    }, false);
                }
            }
            var resolve = engine.preload(path),
                image = new Image();

            image._loaded = false;
            image.src = path;

            image.addEventListener("load", function() {
                this._loaded = true;
                cb && cb(image);
                resolve();
            }, false);

            images[path] = image;
        }
    };

}(engine));