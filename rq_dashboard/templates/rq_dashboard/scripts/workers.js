(function($) {
    var $raw_tpl = $('script[name=worker-row]').html();
    var noWorkersHtml = $('script[name=no-workers-row]').html();
    var template = _.template($raw_tpl);
    var $tbody = $('table#workers tbody');
    var $placeholderEl = $('tr[data-role=loading-placeholder]', $tbody);

    var reload_table = function(done) {
        $placeholderEl.show();

        // Fetch the available workers
        api.getWorkers(function(workers, err) {
            // Return immediately in case of error
            if (err) {
                if (done !== undefined) {
                    done(0);
                }
                return;
            }

            var html = '';

            $tbody.empty();

            if (workers.length > 0) {
                $('#workers-count').html(workers.length + ' workers registered')

                $.each(workers, function(i, worker) {
                    if (worker.state === 'busy') {
                        worker.state = 'play';
                    } else {
                        worker.state = 'pause';
                    }
                    if(worker.total_working_time){
                        let dateObj = new Date(worker.total_working_time * 1000);
                        let hours = dateObj.getUTCHours();
                        let minutes = dateObj.getUTCMinutes();
                        let seconds = dateObj.getSeconds();
                        worker.total_working_time = hours.toString().padStart(2, '0') + ':' +
                            minutes.toString().padStart(2, '0') + ':' +
                            seconds.toString().padStart(2, '0')
                    }
                    html += template({d: worker}, {variable: 'd'});
                });
                $tbody.append(html);
            } else {
                $('#workers-count').html('No workers registered!')
                $tbody.append(noWorkersHtml);
            }

            if (done !== undefined) {
                done(workers.length);
            }
        });
    };

    // Enable the AJAX behaviour of the delete button
    $tbody.on('click', '[data-role=stop-worker-btn]', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $this = $(this),
            $row = $this.parents('tr'),
            worker_name = $row.data('worker-name'),
            url = url_for('stop_worker', worker_name);

        modalConfirm('stop worker', function() {
            $.post(url, function(data) {
                $row.fadeOut('fast', function() { $row.remove(); });
            });
        });

        return false;
    });

    var refresh_table_loop = function() {
        $('span.loading').fadeIn('fast');
        if (AUTOREFRESH_FLAG){
            reload_table(function() {
                $('span.loading').fadeOut('fast');
                setTimeout(refresh_table_loop, POLL_INTERVAL);
            });
        } else {
            setTimeout(refresh_table_loop, POLL_INTERVAL);
        }
    };

    $(document).ready(function() {
        reload_table(function(workers_count) {
            $('#refresh-button').click(reload_table);
            refresh_table_loop();
        });
    });
})($);

