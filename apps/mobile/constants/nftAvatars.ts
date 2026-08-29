export interface NftAvatarOption {
  id: string;
  name: string;
  background: string;
  accent: string;
  secondary: string;
  detail: string;
  uri: string;
}

export const NFT_AVATAR_PREFIX = "nft-avatar:";

const svgToDataUri = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const createAvatar = (
  id: string,
  name: string,
  background: string,
  accent: string,
  secondary: string,
  detail: string,
): NftAvatarOption => ({
  id,
  name,
  background,
  accent,
  secondary,
  detail,
  uri: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${background}"/>
          <stop offset="1" stop-color="${secondary}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="34%" r="58%">
          <stop offset="0" stop-color="#ffffff" stop-opacity=".5"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#bg)"/>
      <circle cx="128" cy="116" r="44" fill="${detail}" opacity=".55"/>
      <circle cx="402" cy="160" r="30" fill="#fff" opacity=".28"/>
      <path d="M88 403c31-88 89-132 168-132s137 44 168 132c-45 38-101 57-168 57s-123-19-168-57z" fill="${accent}"/>
      <circle cx="256" cy="212" r="118" fill="#f8fafc"/>
      <path d="M141 215c17-77 55-116 115-116s98 39 115 116c-34-24-72-36-115-36s-81 12-115 36z" fill="${accent}"/>
      <circle cx="213" cy="225" r="18" fill="#111827"/>
      <circle cx="299" cy="225" r="18" fill="#111827"/>
      <circle cx="219" cy="218" r="6" fill="#fff"/>
      <circle cx="305" cy="218" r="6" fill="#fff"/>
      <path d="M218 291c25 22 51 22 76 0" fill="none" stroke="#111827" stroke-width="16" stroke-linecap="round"/>
      <path d="M166 169c23-58 53-87 90-87s67 29 90 87c-28-16-58-24-90-24s-62 8-90 24z" fill="${detail}"/>
      <path d="M116 112l40 16-40 16-16 40-16-40-40-16 40-16 16-40 16 40z" fill="#fff" opacity=".75"/>
      <rect x="154" y="326" width="204" height="38" rx="19" fill="${detail}" opacity=".9"/>
      <rect x="187" y="334" width="138" height="10" rx="5" fill="#fff" opacity=".55"/>
      <rect width="512" height="512" rx="96" fill="url(#glow)"/>
    </svg>
  `),
});

export const NFT_AVATARS: NftAvatarOption[] = [
  createAvatar("mint-signal", "Mint Signal", "#10b981", "#065f46", "#2563eb", "#f59e0b"),
  createAvatar("coral-byte", "Coral Byte", "#fb7185", "#9f1239", "#14b8a6", "#fde047"),
  createAvatar("solar-node", "Solar Node", "#f59e0b", "#92400e", "#6366f1", "#22c55e"),
  createAvatar("violet-key", "Violet Key", "#8b5cf6", "#4c1d95", "#06b6d4", "#f97316"),
  createAvatar("blue-chip", "Blue Chip", "#0ea5e9", "#075985", "#84cc16", "#f43f5e"),
  createAvatar("graphite-pop", "Graphite Pop", "#334155", "#0f172a", "#ec4899", "#38bdf8"),
];

export const getNftAvatarValue = (avatarId: string) =>
  `${NFT_AVATAR_PREFIX}${avatarId}`;

export const getNftAvatarByValue = (value?: string | null) => {
  if (!value?.startsWith(NFT_AVATAR_PREFIX)) return null;
  const avatarId = value.slice(NFT_AVATAR_PREFIX.length);
  return NFT_AVATARS.find((avatar) => avatar.id === avatarId) ?? null;
};

export const getProfileImageUri = (value?: string | null) =>
  value?.startsWith(NFT_AVATAR_PREFIX) ? undefined : value ?? undefined;
