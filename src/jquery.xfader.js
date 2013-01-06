/*
 * jquery-xfader v1.0.0
 * Copyright 2011-2013 Tomasz Szymczyszyn
 *
 * This plug-in is dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */
(function($) {
  function XFader(target, options) {
    var default_options = {
      auto: true,
      loop: true,
      timeout: 5000,
      next_selector: "#fader-next",
      prev_selector: "#fader-prev",
      controls_selector: "#fader-controls",
      before_change: null,
      change: null
    };

    this.options = $.extend({}, default_options, options);
    this.animating = false;
    this.$views = $(target).find("li");
    this.$controls = $(this.options.controls_selector).find("li");
    this.$prev = $(this.options.prev_selector);
    this.$next = $(this.options.next_selector);
  }

  XFader.prototype.init = function() {
    //this.$views.parent().css({ 'position': 'relative' });
    this.$views.css({ 'position': 'absolute', 'top': 0, 'bottom': 0 });
    this.$views.first().nextAll().hide();
    this.$views.first().addClass('current');

    if (! this.options.loop) {
      this.$prev.hide();
    }

    this.bind_event_handlers();
    this.update_numeric_controls();

    var fader = this;

    if (this.options.auto) {
      var dir = "next";
      var interval = setInterval(function() {
        if (! fader.options.auto) {
          clearInterval(interval);
          return;
        }

        if (dir == "next") {
          if (fader.current_view().get(0) != fader.last_view().get(0)) {
            fader.next();
          }
          else {
            dir = "prev";
            fader.prev();
          }
        }
        else if (dir == "prev") {
          if (fader.current_view().get(0) != fader.first_view().get(0)) {
            fader.prev();
          }
          else {
            dir = "next";
            fader.next();
          }
        }
      }, fader.options.timeout);
    }
  };

  XFader.prototype.bind_event_handlers = function() {
    var fader = this;

    this.$controls.find('a').each(function(idx) {
      $(this).click(function(event) {
        fader.options.auto = false;
        event.preventDefault();
        if (! fader.animating)
          fader.goto_view(idx);
      });
    });

    this.$next.click(function(event) {
      fader.options.auto = false;
      event.preventDefault();
      if (! fader.animating)
        fader.next();
    });

    this.$prev.click(function(event) {
      fader.options.auto = false;
      event.preventDefault();
      if (! fader.animating)
        fader.prev();
    });
  };

  XFader.prototype.current_view = function() {
    return this.$views.filter('.current');
  };

  XFader.prototype.first_view = function() {
    return this.$views.first();
  };

  XFader.prototype.last_view = function() {
    return this.$views.last();
  };

  XFader.prototype.next_view = function() {
    var $next_view = this.current_view().next();
    if (this.options.loop && $next_view.length == 0) {
      $next_view = this.first_view();
    }

    return $next_view;
  };

  XFader.prototype.prev_view = function() {
    var $prev_view = this.current_view().prev();
    if (this.options.loop && $prev_view.length == 0) {
      $prev_view = this.last_view();
    }

    return $prev_view;
  };

  XFader.prototype.next = function() {
    var $current_view = this.current_view();
    var $next_view = this.next_view();

    var fader = this;

    if ($next_view.length > 0) {
      this.animating = true;
      this.call_before_change_handler($current_view.get(0));

      $current_view.animate({ opacity: 0 }, 500);
      $next_view.css('opacity', 0).show().animate({ opacity: 1 }, 500, function() {
        fader.$prev.show();
        $current_view.hide().removeClass('current');
        $next_view.addClass('current');

        fader.update_numeric_controls();
        fader.animating = false;
        fader.call_change_handler($next_view.get(0));
      });
    }
    
    if (! this.options.loop && $current_view.nextAll().length < 2) {
      fader.$next.hide();
    }
  };

  XFader.prototype.update_numeric_controls = function() {
    $(this.$controls.removeClass('current')[this.current_view().prevAll().length]).addClass('current');
  };

  XFader.prototype.prev = function() {
    var $current_view = this.current_view();
    var $prev_view = this.prev_view();

    var fader = this;

    if ($prev_view.length > 0) {
      this.animating = true;
      this.call_before_change_handler($current_view.get(0));

      $current_view.animate({ opacity: 0 }, 500);
      $prev_view.css('opacity', 0).show().animate({ opacity: 1 }, 500, function() {
        fader.$next.show();
        $current_view.hide().removeClass('current');
        $prev_view.addClass('current');

        fader.update_numeric_controls();
        fader.animating = false;
        fader.call_change_handler($prev_view.get(0));
      });
    }

    if (! this.options.loop && $current_view.prevAll().length < 2) {
      fader.$prev.hide();
    }
  };

  XFader.prototype.goto_view = function(idx) {
    var $current_view = this.current_view();
    var $target_view = $(this.$views.get(idx));

    if ($current_view.get(0) == $target_view.get(0))
      return;

    var fader = this;

    this.animating = true;
    this.call_before_change_handler($current_view.get(0));

    $current_view.animate({ opacity: 0 }, 500);
    $target_view.css('opacity', 0).show().animate({ opacity: 1 }, 500, function() {
      fader.$views.filter('.current').removeClass('current').hide();
      $target_view.addClass('current');

      if ($target_view.nextAll().length == 0) {
        fader.$next.hide();
      }
      else {
        fader.$next.show();
      }

      if ($target_view.prevAll().length == 0) {
        fader.$prev.hide();
      }
      else {
        fader.$prev.show();
      }

      fader.update_numeric_controls();
      fader.animating = false;
      fader.call_change_handler($target_view.get(0));
    });
  };

  XFader.prototype.call_before_change_handler = function(view) {
    if (this.options.before_change) {
      this.options.before_change.call(view, this.$views.index(view));
    }
  };

  XFader.prototype.call_change_handler = function(view) {
    if (this.options.change) {
      this.options.change.call(view, this.$views.index(view));
    }
  };

  $.fn.xfader = function() {
    var options = arguments.length > 0 ? arguments[0] : {};

    $(this).each(function() {
      var fader = new XFader(this, options);
      fader.init();
    });

    return $(this);
  };

})(jQuery);
