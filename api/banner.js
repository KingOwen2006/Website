// Vercel Edge Function to serve Discord banner directly
// This fetches the banner and proxies the image bytes

export const config = {
  runtime: 'edge',
};

const DISCORD_USER_ID = '798619259206500365';
const FALLBACK_BANNER_HASH = 'a_8024fe54d79beba91a354baedfbe65af';

export default async function handler(request) {
  const url = new URL(request.url);
  const size = url.searchParams.get('size') || '600';
  
  let bannerUrl;
  let ext = 'gif';
  
  try {
    // Try to fetch from Discord's API to get current banner hash
    const botToken = process.env.DISCORD_BOT_TOKEN;
    
    if (botToken) {
      const response = await fetch(`https://discord.com/api/v10/users/${DISCORD_USER_ID}`, {
        headers: {
          'Authorization': `Bot ${botToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.banner) {
          ext = data.banner.startsWith('a_') ? 'gif' : 'png';
          bannerUrl = `https://cdn.discordapp.com/banners/${DISCORD_USER_ID}/${data.banner}.${ext}?size=${size}`;
        }
      }
    }
    
    // Fallback to hardcoded banner if API failed or no token
    if (!bannerUrl) {
      ext = FALLBACK_BANNER_HASH.startsWith('a_') ? 'gif' : 'png';
      bannerUrl = `https://cdn.discordapp.com/banners/${DISCORD_USER_ID}/${FALLBACK_BANNER_HASH}.${ext}?size=${size}`;
    }
    
    // Fetch the actual image and proxy it
    const imageResponse = await fetch(bannerUrl);
    
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch banner image');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = ext === 'gif' ? 'image/gif' : 'image/png';
    
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    // On error, try to serve fallback directly
    try {
      const fallbackUrl = `https://cdn.discordapp.com/banners/${DISCORD_USER_ID}/${FALLBACK_BANNER_HASH}.gif?size=${size}`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackBuffer = await fallbackResponse.arrayBuffer();
      
      return new Response(fallbackBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      return new Response('Image not found', { status: 404 });
    }
  }
}
