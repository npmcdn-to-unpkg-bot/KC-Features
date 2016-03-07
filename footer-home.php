<?php
/**
 * The template for displaying the front page footer
 *
 * Contains NOTHING
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

		</section>

		<?php do_action( 'foundationpress_layout_end' ); ?>


<?php wp_footer(); ?>
<?php do_action( 'foundationpress_before_closing_body' ); ?>

<script type="text/javascript">
jQuery(function($) {
	$(".page-id-6, body").vegas({
    timer: false,
    delay: 6000,
    transitionDuration: 3000,
    slides: [
        { src: "wp-content/themes/KC%20Features/assets/images/backgrounds/background.jpg" },
        { src: "wp-content/themes/KC%20Features/assets/images/backgrounds/background1.jpg" },
        { src: "wp-content/themes/KC%20Features/assets/images/backgrounds/background2.jpg" },
        { src: "wp-content/themes/KC%20Features/assets/images/backgrounds/background3.jpg" }
    ]
	});
});
</script>
</body>
</html>
