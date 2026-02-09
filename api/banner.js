// Vercel Edge Function to serve Discord banner via Lanyard API
// No bot token required - uses public Lanyard API

export const config = {
  runtime: 'edge',
};

const DISCORD_USER_ID = '798619259206500365';
const FALLBACK_BANNER_HASH = 'a_8024fe54d79beba91a354baedfbe65af';

export default async function handler(request) {
  const url = new URL(request.url);
  const size = url.searchParams.get('size') || '600';
  
  let bannerHash = FALLBACK_BANNER_HASH;
  
  try {
    // Try to fetch from Lanyard API (public, no auth needed)
    const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      // Lanyard includes discord_user with avatar, but banner needs to come from profile
      // Unfortunately Lanyard doesn't include banner hash, so we'll use fallback
      // But we can still serve the image properly
    }
  } catch (e) {
    // Ignore errors, use fallback
  }
  
  // Determine extension based on hash (animated if starts with a_)
  const ext = bannerHash.startsWith('a_') ? 'gif' : 'png';
  const bannerUrl = `https://cdn.discordapp.com/banners/${DISCORD_USER_ID}/${bannerHash}.${ext}?size=${size}`;
  
  try {
    // Fetch and proxy the image
    const imageResponse = await fetch(bannerUrl);
    
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch banner');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = ext === 'gif' ? 'image/gif' : 'image/png';
    
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    // Redirect to Discord CDN as fallback
    return Response.redirect(bannerUrl, 302);
  }
}
