// Vercel Edge Function to redirect to Discord banner
// This fetches the banner hash dynamically from Discord

export const config = {
  runtime: 'edge',
};

const DISCORD_USER_ID = '798619259206500365';
const FALLBACK_BANNER = 'https://cdn.discordapp.com/banners/798619259206500365/a_8024fe54d79beba91a354baedfbe65af.gif?size=600';

export default async function handler(request) {
  const url = new URL(request.url);
  const size = url.searchParams.get('size') || '600';
  
  try {
    // Try to fetch from Discord's API (public endpoint for basic user info)
    const response = await fetch(`https://discord.com/api/v10/users/${DISCORD_USER_ID}`, {
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.banner) {
        const ext = data.banner.startsWith('a_') ? 'gif' : 'png';
        const bannerUrl = `https://cdn.discordapp.com/banners/${DISCORD_USER_ID}/${data.banner}.${ext}?size=${size}`;
        
        return Response.redirect(bannerUrl, 302);
      }
    }
    
    // Fallback to hardcoded banner
    return Response.redirect(FALLBACK_BANNER.replace('size=600', `size=${size}`), 302);
    
  } catch (error) {
    // On error, use fallback
    return Response.redirect(FALLBACK_BANNER.replace('size=600', `size=${size}`), 302);
  }
}



