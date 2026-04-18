interface Env {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname

    // For SPA routing: serve index.html for any path that doesn't have a file extension
    // This enables client-side routing for React Router
    if (!pathname.includes('.') || pathname === '/' || pathname.startsWith('/matches/') || pathname.startsWith('/players/')) {
      try {
        // Fetch index.html from the static site
        const indexResponse = await fetch(`${url.origin}/index.html`)

        if (indexResponse.ok) {
          let html = await indexResponse.text()

          // Inject environment variables into the HTML
          const envScript = `
            <script>
              window.__ENV__ = {
                VITE_SUPABASE_URL: "${env.VITE_SUPABASE_URL}",
                VITE_SUPABASE_ANON_KEY: "${env.VITE_SUPABASE_ANON_KEY}"
              };
            </script>
          `
          html = html.replace('</head>', `${envScript}</head>`)

          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
            },
          })
        }
      } catch (e) {
        console.error('Error serving index.html:', e)
      }
    }

    // For all other requests, let Cloudflare serve the static files automatically
    return fetch(request)
  },
}


