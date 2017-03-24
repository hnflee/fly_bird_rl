var engine = (function() {

    var pageLoaded = false,
        preloading = true,
        assetsToLoad = 0,
        maxAssets = 0;

    return {

        env: {
            w: 0,
            h: 0,
        },

        evt: {
            onloads: [],
            progress: [],
            onload: function(func) {
                if (!pageLoaded) {
                    this.onloads.push(func);
                } else {
                    func();
                }
            }
        },

        preload: function(name) {
            if (!preloading) {
                return function() {};
            }
            maxAssets = Math.max(++assetsToLoad, maxAssets);

            return function() {
                assetsToLoad--;

                engine.evt.progress.map(function(p) {
                    return p(assetsToLoad, maxAssets);
                });

                if (assetsToLoad === 0 && pageLoaded) {
                    preloading = false;
                    engine.evt.onloads.map(function(o) {
                        o();
                    });
                }
            }
        },

        pageLoad: function() {
            pageLoaded = true;
            if (maxAssets === 0 || assetsToLoad === 0) {
                preloading = false;
                engine.evt.onloads.map(function(o) {
                    o();
                });
            }
        },

    };

}());