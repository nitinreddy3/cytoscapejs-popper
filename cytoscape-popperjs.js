// @ts-check
;
(function () {
  'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape) {

    if (!cytoscape) {
      return;
    } // can't register if cytoscape unspecified

    function generateOptions(passedOpts) {
      var opts = Object.assign({}, passedOpts);

      if (!opts.id) {
        opts.id = 'cy-popper-target-' + (Date.now() + Math.round(Math.random() * 10000));
      }
      return opts
    }

    function createPopper(ele) {
      if (ele.scratch('popper')) {
        // Popper has already been created
        var popper = ele.scratch('popper');
        popper.scheduleUpdate();
        return popper;
      } else {
        // need to create a new Popper
        var isCy = ele.pan !== undefined && typeof ele.pan === 'function';
        var isEle = !isCy;
        var isNode = isEle && ele.isNode();
        var cy = isCy ? ele : ele.cy();

        var dim = isNode ? {
          get w() {
            return ele.renderedOuterWidth();
          },
          get h() {
            return ele.renderedOuterHeight();
          }
        } : {
          w: 3,
          h: 3,
        };

        var refObject = {
          getBoundingClientRect: function () {
            var pos = isNode ? ele.renderedPosition() : undefined;
            var cyOffset = cy.container().getBoundingClientRect();
            if (!pos || pos.x === null || isNaN(pos.x)) {
              return;
            }
            return {
              top: pos.y + cyOffset.top + window.pageYOffset,
              left: pos.x + cyOffset.left + window.pageXOffset,
              right: pos.x + dim.w + cyOffset.left + window.pageXOffset,
              bottom: pos.y + dim.h + cyOffset.top + window.pageYOffset,
              width: dim.w,
              height: dim.h,
            };
          },
          get clientWidth() {
            return dim.w
          },
          get clientHeight() {
            return dim.h
          },
        }
        var popperOpts = ele.scratch('popper-opts');
        popperOpts.placement = popperOpts.placement || 'bottom';
        var targetOpt = ele.scratch('popper-target');
        var target = null;
        if (!targetOpt) {
          return;
        } else {
          if (typeof targetOpt === 'function') {
            target = document.getElementById(targetOpt(ele));
          } else if (typeof targetOpt === 'string') {
            target = document.getElementById(targetOpt.substr(1));
            if (target === null) {
              return;
            }
          } else {
            return;
          }
        }
        var popper = new Popper(refObject, target, popperOpts);
        return popper;
      }
    }


    cytoscape('core', 'popperjs', function (passedOpts) {
      // for use on core
      var cy = this;
      var container = cy.container();

      var opts = generateOptions(passedOpts);
      cy.scratch('popper-opts', opts.popper);
      cy.scratch('popper-target', opts.target);
      var popper = createPopper(cy);
      cy.scratch('popper', popper);

      return this; // chainability
    });

    cytoscape('collection', 'popperjs', function (passedOpts) {
      // for use on elements
      var eles = this;
      var cy = this.cy()
      var container = cy.container()

      eles.each(function (ele, i) {
        var opts = generateOptions(passedOpts);
        ele.scratch('popper-opts', opts.popper || {});
        ele.scratch('popper-target', opts.target);
        var popper = createPopper(ele);
        ele.scratch('popper', popper);
      });

      return this; // chainability
    });

  };

  if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
    module.exports = function (cytoscape) {
      register(cytoscape);
    };
  } else if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
    define('cytoscape-popperjs', function () {
      return register;
    });
  }

  if (typeof cytoscape !== 'undefined') { // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape);
  }

})();