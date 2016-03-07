<?php
/**
 * Stop WordPress auto formatting posts
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

remove_filter('the_content', 'wpautop');
remove_filter('the_excerpt', 'wpautop');
remove_filter('comment_text', 'wpautop');
remove_filter('the_title', 'wpautop');