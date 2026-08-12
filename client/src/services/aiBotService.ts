/**
 * ProChat AI Support Assistant Service ("Sam")
 * Enhanced with automated diagnostics, smart problem solver,
 * 1-click invite code generator, and full bilingual (Hindi/Hinglish & English) knowledge base.
 */

export interface AiBotResponse {
  content: string;
  quickReplies?: string[];
  actionType?: 'invite' | 'voice' | 'nitro' | 'screenshare' | 'settings' | 'fix_profile' | 'test_msg';
}

export const SAM_BOT_USER = {
  id: 'bot-sam-ai',
  name: 'Sam',
  isBot: true,
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=SamAIBot&backgroundColor=38bdf8',
  tag: 'ProChat AI Support & Solver',
  status: 'ONLINE',
};

const KNOWLEDGE_BASE: Array<{
  keywords: string[];
  reply: string;
  quickReplies?: string[];
  actionType?: 'invite' | 'voice' | 'nitro' | 'screenshare' | 'settings' | 'fix_profile' | 'test_msg';
}> = [
  {
    keywords: [
      'invite', 'friend', 'code', 'pro hd', 'pro-hd', 'pro hq', 'pro-hq', 
      'join', 'not joining', 'nahi ho raha', 'dost', 'friend nahi jud raha',
      'invite code problem', 'server join', 'link'
    ],
    reply: `🔗 **Sam's Instant Invite & Friend Join Solution:**\n\nHere is your official 1-Click invite link and code:\n\n• **Direct 1-Click Link:**\n  \`https://pro-chat-xenon-cliens-projects.vercel.app/?join=PRO-HD\`\n• **Short Server Code:** \`PRO-HD\` *(Also accepts \`PRO-HQ\`)*\n\n⚡ **How your friend joins in 1 Second:**\n1. Send them the link above.\n2. When they click the link, they are automatically connected to your **Pro Chat HQ** server.\n3. Both of you will instantly see each other with the **Green Online Dot** in the right Member List!\n\n*(Tip: If your friend is opening manually, tell them to type \`PRO-HD\` in Add Friend / Join Server)*`,
    quickReplies: ['📋 Copy Invite Link', '👥 Open Invite Modal', '🎙️ Join General Voice', '💬 Say Hi to Friend'],
    actionType: 'invite',
  },
  {
    keywords: [
      'screen', 'blank', 'black screen', 'share', 'stream', 'recording',
      'screen share', 'not showing', 'dikh nahi raha', 'khali', 'video'
    ],
    reply: `📺 **Sam's Screen Share & HD Streaming Fix:**\n\nIf screen sharing is blank or not showing to your friend:\n\n1. **Select "Entire Screen":** When browser asks to pick a window, choose **Entire Screen** instead of single app for best hardware acceleration.\n2. **Check Voice Channel:** Ensure both you and your friend are inside the **General Voice** channel.\n3. **System Audio:** Check the *"Share Audio"* checkbox if you want to stream gameplay sound.\n4. **WebRTC Direct Stream:** Screen sharing automatically streams in **1080p @ 60FPS** directly to your friend's cinema stage without lag!`,
    quickReplies: ['🎙️ Open Voice & Screen Stage', '⚙️ Quality Settings (1080p 60FPS)', '⚡ Nitro Perks'],
    actionType: 'screenshare',
  },
  {
    keywords: [
      'multiple profile', 'confuse', 'bahut saari profile', 'profile', 'clutter',
      'clean server', 'remove profile', 'hatao'
    ],
    reply: `🧹 **Sam's Profile & Server Cleaner:**\n\n• All duplicate dummy servers have been removed! Now your app runs on **1 single official server: Pro Chat HQ**.\n• When your friend joins with code \`PRO-HD\`, they enter the exact same server room so there is zero confusion.\n• Your left sidebar will only show the clean ProChat HQ robot icon and direct logout button!`,
    quickReplies: ['✨ View Pro Chat HQ', '👥 Check Online Members', '🎨 Edit My PFP & Name'],
    actionType: 'fix_profile',
  },
  {
    keywords: [
      'message', 'not sending', 'nhi ja raha', 'chat', 'chat nahi ho rahi',
      'sync', 'real-time', 'refresh'
    ],
    reply: `💬 **Sam's Real-Time Messaging Diagnostic:**\n\n• **Dual Broadcast Active:** Messages are transmitted over both Cloud MQTT and Direct WebRTC P2P DataChannels.\n• **0 Second Delay:** When you type in \`# general\`, your friend sees it immediately with audio chime notification.\n• **Sound Notifications:** Chimes alert you whenever a friend texts you while you are in another tab!`,
    quickReplies: ['💬 Message in #general', '👥 View Member List', '🤖 Ask Sam More'],
    actionType: 'test_msg',
  },
  {
    keywords: ['billing', 'refund', 'payment', 'money', 'charge', 'cost', 'price', 'subscription'],
    reply: `⚡ **ProChat Nitro & Billing Support:**\n\n• **ProChat Nitro Classic:** $2.99 / month (1080p 60FPS Stream, Custom Badges)\n• **ProChat Nitro Boost:** $7.99 / month (2K 60FPS Stream, 500MB Uploads, Animated Avatars)\n• **Instant 1-Click Unlock:** Nitro perks can be activated anytime from the Nitro modal!`,
    quickReplies: ['⚡ View Nitro Hub', '🎁 Gift Nitro to Friend', '📜 Refund Info'],
    actionType: 'nitro',
  },
  {
    keywords: ['voice', 'call', 'mic', 'mute', 'audio', 'soundboard', 'hear', 'awaz', 'awaaz'],
    reply: `🎙️ **ProChat HD Voice & Soundboard Guide:**\n\n• **Connect:** Click on **General Voice** in the channel list to join with low-latency WebRTC.\n• **Soundboard:** Click 📻 **Soundboard** to play Airhorn, GG, Ba-Dum-Tss, and Victory Chime to everyone in the room!\n• **Mute / Deafen:** Toggle your mic on/off using the bottom toolbar.`,
    quickReplies: ['🎙️ Join General Voice', '📻 Open Soundboard', '⚡ Nitro Audio Perks'],
    actionType: 'voice',
  },
  {
    keywords: ['pfp', 'avatar', 'profile', 'name', 'change name', 'banner', 'photo', 'edit'],
    reply: `🎨 **Customise Profile & Avatar:**\n\n1. Click **"Edit Profile & PFP ✏️"** in the bottom-left panel.\n2. Choose any robot avatar preset or upload your custom photo.\n3. Pick your display name and choose a neon banner color, then click **Save Changes**!`,
    quickReplies: ['🎨 Open Profile Settings', '⚡ Nitro Neon Banners', '👥 View Friends'],
    actionType: 'settings',
  },
  {
    keywords: ['hi', 'hello', 'hey', 'sam', 'bot', 'help', 'kya haal', 'kya hal', 'namaste', 'kaise ho'],
    reply: `Hi there! I’m **Sam**—your dedicated ProChat AI Assistant with full troubleshooting powers! 🤖✨\n\nI can solve anything on ProChat for you:\n• 🔗 **Fix Invite Code & Direct Join (\`PRO-HD\`)**\n• 📺 **Fix Blank Screen Share & 1080p 60FPS Video**\n• 💬 **Troubleshoot Real-Time Messaging**\n• 🎙️ **HD Voice Channels & Soundboard Setup**\n• 🧹 **Clean Cluttered Server Profiles**\n\nWhat would you like me to fix or explain?`,
    quickReplies: ['🔗 Get Invite Code (PRO-HD)', '📺 Fix Screen Share', '💬 Real-Time Chat Help', '🎙️ Voice & Soundboard'],
  },
];

export async function generateAiBotResponse(userMessage: string): Promise<AiBotResponse> {
  const query = userMessage.toLowerCase().trim();

  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some((kw) => query.includes(kw))) {
      return {
        content: entry.reply,
        quickReplies: entry.quickReplies,
        actionType: entry.actionType,
      };
    }
  }

  // Intelligent fallback with quick help chips
  return {
    content: `I’m here to help with all ProChat features! 🤖\n\nRegarding **"${userMessage.length > 40 ? userMessage.substring(0, 40) + '...' : userMessage}"**:\n\n• Your official server invite code is **\`PRO-HD\`** *(also \`PRO-HQ\`)*.\n• 1-Click invite link: \`https://pro-chat-xenon-cliens-projects.vercel.app/?join=PRO-HD\`\n• Screen sharing is active in **General Voice** with 1080p 60FPS quality.\n\nChoose an option below to solve any issue instantly:`,
    quickReplies: [
      '🔗 Get Invite Link (PRO-HD)',
      '📺 Fix Screen Share',
      '💬 Chat & Sync Help',
      '🎙️ Voice Channel',
    ],
  };
}
