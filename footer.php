<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the "off-canvas-wrap" div and all content after.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

		</section>
		<div id="footer-container">
			<footer id="contact">
				<?php do_action( 'foundationpress_before_footer' ); ?>
				
				<div class="row">
					<div class="medium-5 columns">
						<div class="row" id="contactMessage">
							<div class="small-12 end columns">
								<h2 class="text-center">Contact</h2>
								<p>Please contact me with any questions you might have, your ideas for your project, etc. Let me know what your budget is and I will give you a few options within your budget at various price levels. I would love to speak with you about your project and see how we can best partner together.</p>
								<br />
								<center><div id="emailButton"><a href="mailto:kasey@kcfeatures.com" class="button hollow">kasey@kcfeatures.com</a></div></center>
								
							</div>
						</div>
					</div>

					<div class="medium-7 columns">
						<div class="row">
							<div class="medium-12 small-8 small-centered medium-uncentered large-uncentered columns">
								<?php
								echo do_shortcode('[instagram-feed]');
								?>
							</div>
						</div>
					</div>	
				</div>

				<?php do_action( 'foundationpress_after_footer' ); ?>
			</footer>
		</div>

		<?php do_action( 'foundationpress_layout_end' ); ?>

<?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) == 'offcanvas' ) : ?>
		</div><!-- Close off-canvas wrapper inner -->
	</div><!-- Close off-canvas wrapper -->
</div><!-- Close off-canvas content wrapper -->
<?php endif; ?>

<?php wp_footer(); ?>

<script type="text/javascript">
jQuery(function($) {
	var $photographyPortfolio = $('#photographyPortfolio').imagesLoaded( function() {
	  // init Masonry after all images have loaded
	  $photographyPortfolio.masonry({
	    // options...
	    itemSelector: '.column',
	    columnWidth: '.column',
	    percentPosition: true,
	  });
	});
});
</script>


<?php do_action( 'foundationpress_before_closing_body' ); ?>
</body>
</html>
