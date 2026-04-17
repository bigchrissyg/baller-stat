interface Env {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
}

// Serve static assets from dist folder
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname

    try {
      // Always try to serve the exact requested file first
      const assetRequest = new Request(new URL(pathname, url.origin), request)
      const response = await env.ASSETS.fetch(assetRequest)
      
      if (response.status === 200) {
        return response
      }
    } catch (e) {
      // Continue to fallback
    }

    // For SPA routing: if requesting a path without an extension, serve index.html
    if (!pathname.includes('.')) {
      try {
        return await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request))
      } catch (e) {
        // Continue to fallback
      }
    }

    // Default: serve index.html for 404s to enable SPA client-side routing
    try {
      const indexRequest = new Request(new URL('/index.html', url.origin), request)
      const indexResponse = await env.ASSETS.fetch(indexRequest)
      
      // Inject environment variables into the HTML
      let html = await indexResponse.text()
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
          ...Object.fromEntries(indexResponse.headers),
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    } catch (e) {
      return new Response('Not found', { status: 404 })
    }
  },
}


