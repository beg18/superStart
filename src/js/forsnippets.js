 /* FAQ
     ========================*/

     $(".js-faq-title").on("click", function(e) {

         e.preventDefault();
         var $this = $(this);

         if( !$this.hasClass("active") ) {
             $(".js-faq-content").slideUp();
             $(".js-faq-title").removeClass("active");
         }

         $this.toggleClass("active");
         $this.next().slideToggle();

     });