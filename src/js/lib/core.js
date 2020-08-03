const $ = function(selector, context) {
    return new $.prototype.init(selector, context);
};


$.prototype.init = function(selector) {
    if (!selector) {
        return this; // {}
    }

    if (selector.tagName) {
        this[0] = selector;
        this.length = 1;
        return this;
    }

    Object.assign(this, document.querySelectorAll(selector));
    this.length = document.querySelectorAll(selector).length;
    return this;
};
const array = Array.prototype;
$.prototype.init.prototype = $.prototype;

window.$ = $;

export default $;