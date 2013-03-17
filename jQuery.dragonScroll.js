/*
*jQuery.dragonScroll
*
*Dan Terwilliger
*/

var DragonScrollClass = function (options, me) {
    var self = this, startLeft, children, parent, container, cWidth, pWidth, parentCss, childCss;
    
    this.me = me;
    this.opt = {
        distance: 5,
        duration: 300,
        children: self.me.children(),
        parent: self.me,
        container: self.me.parent(),
        parentWidth: 0,
        startPos: "left"
    };
    
    if (options || false) {
        for (var a in self.opt) {
            if (typeof options[a] != "undefined") self.opt[a] = options[a];
        }
    };

    this.parentStart = 0; //Updated every scroll movement
    this.childStart = 0; //Updated every scroll movement
    this.parentXMin = 0;
    this.childYMin = 0;
    this.setUp = function() {
        startLeft = 0,
        children = self.opt.children,
        parent = self.opt.parent,
        container = self.opt.container,
        cWidth = $(children[0]).outerWidth(),
        pWidth = self.opt.parentWidth > 0 ? self.opt.parentWidth : children.length * (cWidth);
        if (pWidth < container.width()) {
            pWidth = container.width();
        }
        if (self.opt.startPos.toLowerCase() === "right") {
            startLeft = -1 * (pWidth - container.innerWidth());
            self.parentStart = startLeft;
        }

        parentCss = { position: "relative", padding: "0", margin: "0", listStyle: "none", width: pWidth, left: startLeft };
        childCss = { position: "relative" };

        parent.css(parentCss);
        children.each(function () {
            var subs = $(this).children(), totalHeight = 0;
            $(this).css(childCss);
            $.each(subs, function () {
                totalHeight = totalHeight + $(this).outerHeight();
            });

            $(this).height(totalHeight);
        }).enableSelection(false);
    };

    this.setUp();

    children.draggable({
        distance: self.opt.distance,
        start: function (event, ui) {
            ui.helper.data('dragonScroll.originalPosition', ui.position || { top: 0, left: 0 });
            ui.helper.data('dragonScroll.newDrag', true);
        },
        drag: function (event, ui) {
            var originalPosition = ui.helper.data('dragonScroll.originalPosition');
            var deltaX = Math.abs(originalPosition.left - ui.position.left);
            var deltaY = Math.abs(originalPosition.top - ui.position.top);

            var newDrag = ui.helper.data('dragonScroll.newDrag');
            ui.helper.data('dragonScroll.newDrag', false);

            var xMax = newDrag ? Math.max(deltaX, deltaY) === deltaX : ui.helper.data('dragonScroll.xMax');
            ui.helper.data('dragonScroll.xMax', xMax);

            var newPosition = ui.position;
            if (xMax) {
                var newLeft = self.parentStart + newPosition.left;
                parent.css({
                    left: newLeft
                });
                newPosition.top = originalPosition.top;
                newPosition.left = originalPosition.left;
            }
            if (!xMax) {
                newPosition.left = originalPosition.left;
            }
            return newPosition;
        },
        stop: function (event, ui) {
            var originalPosition = ui.helper.data('dragonScroll.originalPosition');
            var parentLeft = parseInt(parent.css("left"), 10),
                parentMax = (parent.width() - container.width()) * -1,
                childTop = ui.position.top,
                childMax = $(this).outerHeight() < container.innerHeight() ? 0 : ($(this).outerHeight() - container.innerHeight()) * -1,
                deltaX = Math.abs(originalPosition.left - ui.position.left),
                deltaY = Math.abs(originalPosition.top - ui.position.top);
            if (Math.max(deltaX, deltaY) === deltaX) {
                if (parentLeft > self.parentXMin) {
                    parentLeft = self.parentXMin;
                    parent.animate({ left: parentLeft }, self.opt.duration);
                }
                if (parentLeft < parentMax) {
                    parentLeft = parentMax;
                    parent.animate({ left: parentMax }, self.opt.duration);
                }
                self.parentStart = parentLeft;
            } else {
                if (childTop > self.childYMin) {
                    $(this).animate({ top: self.childYMin }, self.opt.duration);
                }
                if (childTop < childMax) {
                    $(this).animate({ top: childMax }, self.opt.duration);
                }
            }

        }
    });

    this.remove = function() {
        children.removeData("draggable")
            .unbind(".draggable")
            .removeClass("ui-draggable ui-draggable-dragging ui-draggable-disabled")
            .enableSelection(true);
        self.me.data('__dragonscroll', ''); //erase all traces
        self.me = null;
        return self;
    };
};

var DragonScrollArray = function (doms) {
    var self = this;
    this.length = 0;
    this.name = "dragonscrollarray";

    this.each = function (fn) {
        for (var a = 0; a < self.length; a++) fn.call(self[a]);
        return self;
    };

    this.push = function (dragon) {
        self[self.length] = dragon;
        self.length++;
    };

    this.eq = function (idx) {
        return self[idx];
    };

    this.resetValues = function() {
        if (doms) {
            for (var a = 0; a < doms.length; a++) {
                var dragon = $.data(doms[a], '__dragonscroll') || false;
                if (dragon) {
                    dragon.setUp();
                }
            };
        }
    };

    this.remove = function() {
        if (doms) {
            for (var a = 0; a < doms.length; a++) {
                var dragon = $.data(doms[a], '__dragonscroll') || false;
                if (dragon) {
                    dragon.remove();
                    
                }
            };
            self = [];
        }
    };

    if (doms) {
        for (var a = 0; a < doms.length; a++) {
            var dragon = $.data(doms[a], '__dragonscroll') || false;
            if (dragon) {
                this[this.length] = dragon;
                this.length++;
            }
        };
    }

    return this;
};

$.fn.getDragonScroll = function (index) {
    if (typeof index == "undefined") {
        return new DragonScrollArray(this);
    } else {
        var dragon = $.data(this[index], '__dragonscroll') || false;
        return dragon;
    }
};

$.fn.dragonScroll = function (aOptions) {
    var dsa = new DragonScrollArray();
    if (typeof aOptions == "undefined") aOptions = {};
    
    this.each(function () {
        var dragon = $(this).data('__dragonscroll') || false;
        if (!dragon) {
            dragon = new DragonScrollClass(aOptions, $(this));
            $(this).data('__dragonscroll', dragon);
        }
        dsa.push(dragon);
    });
    return (dsa.length == 1) ? dsa[0] : dsa;
};

