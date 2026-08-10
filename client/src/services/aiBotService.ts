/**
 * ProChat AI Support Assistant Service ("Sam")
 * Provides intelligent, professional responses with Discord-style markdown,
 * ProChat product knowledge, troubleshooting, and interactive guides.
 */

export interface AiBotResponse {
  content: string;
  quickReplies?: string[];
  actionType?: 'invite' | 'voice' | 'nitro' | 'screenshare' | 'settings';
}

export const SAM_BOT_USER = {
  id: 'bot-sam-ai',
  name: 'Sam',
  isBot: true,
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=SamAIBot&backgroundColor=38bdf8',
  tag: 'ProChat AI Support',
  status: 'ONLINE',
};

const KNOWLEDGE_BASE: Array<{
  keywords: string[];
  reply: string;
  quickReplies?: string[];
  actionType?: 'invite' | 'voice' | 'nitro' | 'screenshare' | 'settings';
}> = [
  {
    keywords: ['billing', 'refund', 'payment', 'money', 'charge', 'cost', 'price', 'subscription'],
    reply: `I’m here to help! For billing or refund requests, I can assist with subscription details, Nitro receipts, and account queries.\n\nHere are quick billing options:\n• **ProChat Nitro Classic:** $2.99 / month (HD Screen Share & Badges)\n• **ProChat Nitro Boost:** $7.99 / month (2K 60FPS Stream, 500MB Uploads, Animated Avatars)\n• **Refund Policy:** Purchases made within 14 days without claim are eligible for instant refunds.\n\nWould you like me to open the Nitro & Billing Hub for you?`,
    quickReplies: ['⚡ View Nitro Hub', '💬 Contact Support Team', '📜 Refund Policy'],
    actionType: 'nitro',
  },
  {
    keywords: ['screen', 'recording', 'share', 'stream', 'blank', 'black screen', 'fps', 'resolution', 'display'],
    reply: `Here’s how screen sharing works on ProChat:\n\n1. **Start Sharing:** Go to any Voice Channel (e.g. \`General Voice\`) and click the **"Share Screen"** button at the bottom.\n2. **Select Window:** Choose between **Entire Screen**, **Window**, or **Browser Tab**.\n3. **Audio Toggle:** Make sure *"Share System Audio"* is checked if you want friends to hear gameplay or music.\n4. **Troubleshooting Blank Screen:**\n   • Ensure your browser has Screen Recording permissions enabled in Windows/macOS Settings.\n   • If sharing a hardware-accelerated app (e.g. Chrome/Discord), select **"Entire Screen"** for best performance.\n   • Stream in **1080p @ 60FPS** or **2K HD** for crystal-clear quality!`,
    quickReplies: ['🎙️ Join Voice Channel', '⚙️ Screen Share Settings', '⚡ Nitro 60FPS Perks'],
    actionType: 'screenshare',
  },
  {
    keywords: ['invite', 'friend', 'code', 'link', 'join server', 'add friend', 'not working'],
    reply: `Connecting with friends on ProChat is easy and instant!\n\n**Option 1: 1-Click Direct Join Link**\nShare your link: \`https://pro-chat-xenon-cliens-projects.vercel.app/?join=<CODE>\`\nYour friend clicks it and joins your server automatically without logging in.\n\n**Option 2: Server Invite Code**\n1. Click **"Invite Friends"** in your server to copy your 6-character code (e.g. \`PRO-HQ-8821\`).\n2. Your friend opens ProChat, clicks the **\`+\`** button in the left sidebar, and enters the code in **"Discover & Join Servers"**!\n\n**Option 3: Direct In-App Invite**\nClick **Invite** next to any friend in the Invite Modal to send an instant notification popup to their screen!`,
    quickReplies: ['👥 Open Invite Modal', '➕ Join Server with Code', '💬 Friends Hub'],
    actionType: 'invite',
  },
  {
    keywords: ['voice', 'call', 'mic', 'mute', 'audio', 'soundboard', 'hear'],
    reply: `**ProChat HD Voice & Soundboard Guide:**\n\n• **Voice Channels:** Click any voice channel (like \`#General Voice\`) to connect instantly with WebRTC low-latency audio.\n• **Soundboard:** Click the **Soundboard 📻** button during a call to play sound effects (Airhorn, GG, Ba-Dum-Tss, Victory Chime) to everyone in the room!\n• **Mute / Deafen:** Toggle your microphone using the bottom control bar or use shortcut keys.\n• **Speaking Glow:** Active speakers have a glowing cyan & pink radar wave around their character avatar.`,
    quickReplies: ['🎙️ Join Voice Stage', '📻 Open Soundboard', '⚡ Nitro Audio Perks'],
    actionType: 'voice',
  },
  {
    keywords: ['nitro', 'perk', 'badge', 'boost', 'upgrade', 'gift'],
    reply: `⚡ **ProChat Nitro Features & Perks:**\n\n• **Ultra HD Screen Sharing:** Stream games and windows in 1080p 60FPS and 2K resolution.\n• **Animated Robot Avatars & Custom PFP:** Choose from exclusive cyberpunk avatars or upload your custom photo.\n• **Profile Banners & Colors:** Custom neon gradient banner swatches for your profile card.\n• **Nitro Gold Badge:** Shimmering gold Discord Nitro badge next to your display name.\n• **Custom Soundboard & Emoji Vault:** Unlimited soundboard uploads and custom animated emojis.\n• **Gift Nitro:** Send 1-month or 1-year Nitro gifts to friends in any chat!`,
    quickReplies: ['⚡ Subscribe to Nitro', '🎁 Gift Nitro to Friend', '🎨 Customise Profile'],
    actionType: 'nitro',
  },
  {
    keywords: ['pfp', 'avatar', 'profile', 'name', 'change name', 'banner', 'photo', 'edit'],
    reply: `To customize your **Profile Picture (PFP)**, **Display Name**, and **Profile Banner**:\n\n1. Click on your profile card at the bottom-left of the sidebar, or click **"Edit Profile & PFP ✏️"**.\n2. Choose any animated robot avatar preset or click **"Upload Custom Photo"**.\n3. Type your new display name and choose a neon profile banner color!\n4. Click **"Save Changes"** — your profile updates instantly across all connected servers!`,
    quickReplies: ['🎨 Open Profile Settings', '⚡ Nitro Neon Banners', '👥 View Friends'],
    actionType: 'settings',
  },
  {
    keywords: ['hi', 'hello', 'hey', 'sam', 'bot', 'help', 'start', 'kya haal', 'kya hal', 'namaste'],
    reply: `Hi there! Thanks for reaching out to ProChat support. I’m **Sam**—your dedicated ProChat AI Assistant! 🤖✨\n\nI can help you with:\n• 🎙️ **HD Voice & Screen Sharing** troubleshooting\n• 👥 **Server Invites & Friends Auto-Join**\n• ⚡ **ProChat Nitro & Billing**\n• 🎨 **Custom Profile Picture & Avatar Setup**\n• 🛠️ **Server Moderation & Channel Setup**\n\nWhat would you like assistance with today?`,
    quickReplies: ['📺 Screen Sharing Help', '👥 Server Invite Guide', '⚡ Nitro & Billing', '🎙️ Voice & Soundboard'],
  },
];

export async function generateAiBotResponse(userMessage: string): Promise<AiBotResponse> {
  const query = userMessage.toLowerCase().trim();

  // Check knowledge base
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some((kw) => query.includes(kw))) {
      return {
        content: entry.reply,
        quickReplies: entry.quickReplies,
        actionType: entry.actionType,
      };
    }
  }

  // Smart contextual fallback response
  return {
    content: `Thanks for reaching out! Regarding **"${userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage}"**:\n\nI'm here to assist you with all ProChat features including **Screen Sharing**, **Server Invites**, **HD Voice Calls**, and **Nitro Billing**.\n\nCould you please let me know which area you'd like guidance on?`,
    quickReplies: [
      '📺 Screen Sharing Guide',
      '👥 How to Invite Friends',
      '⚡ Nitro Features',
      '🎙️ Voice Channel Setup',
    ],
  };
}
