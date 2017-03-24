(function (engine, MainScreen) {

    "use strict";

    engine.TitleScreen = engine.Screen.extend({

        x: 0,
        y: 0,


        init: function () {

        },

        tick: function () {
            if (engine.input.pressed("jump")) {
                engine.game.setScreen(new engine.MainScreen());
            }
        },

        render: function () {

            var now = Date.now(),
                atlas = engine.game.atlas;

            atlas.render("bg_day", 0, 0);

            var ySin = Math.sin(now / 150) * 7;
            atlas.render("title", 55, engine.env.h * 0.18);

            atlas.render(
                "bird0_" + ((now / 100 | 0) % 3),
                engine.env.w * 0.42,
                engine.env.h * 0.38 + ySin - 5
            );

            atlas.render("land", -((now / 6 | 0) % 288), engine.env.h - 112);
            atlas.render("land", 289 - ((now / 6 | 0) % 288), engine.env.h - 112);

            atlas.render("button_play", 20, engine.env.h - 172);
            atlas.render("button_score", 152, engine.env.h - 172);
            atlas.render("button_rate", 106, engine.env.h - 242);
        }
    });

}(engine));
