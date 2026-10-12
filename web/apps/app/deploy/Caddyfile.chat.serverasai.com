# asAi Chat — reverse proxy site block.
#
# Append this to the host Caddyfile that already fronts serveras.click / serverasai.com, or
# include it from there. Caddy obtains and renews the certificate for the subdomain
# automatically (DNS for chat.serverasai.com must already point at this host).
#
# The upstream is the loopback port the compose service publishes; nothing else exposes the app.

chat.serverasai.com {
	encode zstd gzip

	# The app is a static-asset + RSC + small API surface. No websockets are needed; the chat
	# stream is ordinary HTTP streaming, which Caddy passes through.
	reverse_proxy 127.0.0.1:3002 {
		header_up X-Forwarded-Proto {scheme}
		header_up X-Forwarded-Host {host}
		header_up X-Real-IP {remote_host}
	}

	header {
		# Belt-and-braces: the app also sets these, but the proxy wins if the app is down.
		Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
	}

	log {
		output file /var/log/caddy/chat.serverasai.com.log {
			roll_size 20MiB
			roll_keep 10
		}
	}
}
