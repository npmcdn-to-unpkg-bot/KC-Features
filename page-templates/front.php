<?php
/*
Template Name: Front
*/
get_header( 'home' ); ?>

<section id="frontPage">

	<?php do_action( 'foundationpress_before_content' ); ?>
	<?php while ( have_posts() ) : the_post(); ?>

		<div <?php post_class() ?> id="post-<?php the_ID(); ?>">
			<?php do_action( 'foundationpress_page_before_entry_content' ); ?>
			<div class="entry-content">
				<?php the_content(); ?>
			</div>
		</div>

	<?php endwhile;?>
	<?php do_action( 'foundationpress_after_content' ); ?>

</section>

<?php get_footer( 'home' );

