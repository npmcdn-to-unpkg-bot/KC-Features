;(function (window, document, undefined) {

    'use strict';

    // Cut the mustard
    var supports = 'querySelector' in document && 'addEventListener' in window;
    if ( !supports ) return;

    // Get all anchors
    var anchors = document.querySelectorAll( '[href*="#"]' );

    // Add smooth scroll to all anchors
    for ( var i = 0, len = anchors.length; i < len; i++ ) {
        var url = new RegExp( window.location.hostname + window.location.pathname );
        if ( !url.test( anchors[i].href ) ) continue;
        anchors[i].setAttribute( 'data-scroll', true );
    }

    // Initial smooth scroll (add your attributes as desired)
    smoothScroll.init();

})(window, document);