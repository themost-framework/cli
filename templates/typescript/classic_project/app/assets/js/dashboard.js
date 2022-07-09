/* eslint no-var: "off" */
(function($) {
    $.get({
        url: '/users/me',
        dataType: 'json'
    }).done(function(data) {
        // convert date
        data.dateCreated = new Date(data.dateCreated).toDateString();
        // a very simple data binding
        $('[data-bind]').each(function() {
            // eslint-disable-next-line no-invalid-this
            var $this = $(this);
            $this.html(data[$this.data('bind')]);
        });
    });
})(jQuery);
/* eslint no-var: "error" */

