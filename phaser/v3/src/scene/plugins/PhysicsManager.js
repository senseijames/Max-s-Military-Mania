var Class = require('../../utils/Class');
var GetValue = require('../../utils/object/GetValue');
var Merge = require('../../utils/object/Merge');
var NOOP = require('../../utils/NOOP');

//  Physics Systems
var Impact = require('../../physics/impact/Impact');

var PhysicsManager = new Class({

    initialize:

    function PhysicsManager (scene)
    {
        this.scene = scene;

        this.gameConfig = scene.sys.game.config.physics;
        this.defaultSystem = scene.sys.game.config.defaultPhysicsSystem;
        this.sceneConfig = scene.sys.settings.physics;

        //  This gets set to an instance of the physics system during boot
        this.system;

        //  This gets set by the physics system during boot
        this.world = { update: NOOP };

        //  This gets set by the physics system during boot
        this.add;
    },

    boot: function ()
    {
        var sceneSystem = GetValue(this.sceneConfig, 'system', false);

        if (!this.defaultSystem && !sceneSystem)
        {
            //  No default physics system or system in this scene, so abort
            return;
        }

        //  Which physics system are we using in this Scene?
        var system = (sceneSystem !== false) ? sceneSystem : this.defaultSystem;

        //  Create the config for it
        var config = Merge(this.sceneConfig, GetValue(this.gameConfig, system, {}));

        switch (system)
        {
            case 'impact':
                this.system = new Impact(this, config);
                break;
        }
    },

    update: function (time, delta)
    {
        this.world.update(time, delta);
    }

});

module.exports = PhysicsManager;
