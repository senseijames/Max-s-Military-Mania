var Rectangle = require('../../geom/rectangle/Rectangle');

var GetBounds = {

    getBounds: function (output)
    {
        if (output === undefined) { output = new Rectangle(); }

        var x = this.x - this.displayOriginX;
        var y = this.y - this.displayOriginY;

        var w = this.displayWidth;
        var h = this.displayHeight;

        var r = this.rotation;

        var wct = w * Math.cos(r);
        var hct = h * Math.cos(r);

        var wst = w * Math.sin(r);
        var hst = h * Math.sin(r);

        var xMin = x;
        var xMax = x;
        var yMin = y;
        var yMax = y;

        if (r > 0)
        {
            if (r < 1.5707963267948966)
            {
                // 0 < theta < 90
                yMax = y + hct + wst;
                xMin = x - hst;
                xMax = x + wct;
            }
            else
            {
                // 90 <= theta <= 180
                yMin = y + hct;
                yMax = y + wst;
                xMin = x - hst + wct;
            }
        }
        else if (r > -1.5707963267948966)
        {
            // -90 < theta <= 0
            yMin = y + wst;
            yMax = y + hct;
            xMax = x + wct - hst;
        }
        else
        {
            // -180 <= theta <= -90
            yMin = y + wst + hct;
            xMin = x + wct;
            xMax = x - hst;
        }

        output.x = xMin;
        output.y = yMin;
        output.width = xMax - xMin;
        output.height = yMax - yMin;

        return output;
    }
};

module.exports = GetBounds;
