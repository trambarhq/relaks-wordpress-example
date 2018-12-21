docker-compose exec varnish varnishstat

docker-compose exec varnish varnishncsa -F '%h %U%q %{Varnish:hitmiss}x'
