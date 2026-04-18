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
    if (!pathname.includes('.') || pathname === '/') {
      // Fetch the index.html from the static assets
      const page = await fetch(new URL('/index.html', url.origin))

      if (page.ok) {
        let html = await page.text()

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
            ...Object.fromEntries(page.headers.entries()),
          },
        })
      }
    }

    // For all other requests, let Cloudflare serve the static assets directly
    return fetch(request)
  },
}


