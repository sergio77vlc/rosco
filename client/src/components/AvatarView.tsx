import React from 'react';

interface AvatarViewProps {
  avatar: string;
  size?: number;
  color?: string;
  className?: string;
}

export function isPhotoAvatar(avatar: string): boolean {
  return avatar?.startsWith('data:image');
}

export default function AvatarView({ avatar, size = 40, color = '#8b5cf6', className = '' }: AvatarViewProps) {
  const style: React.CSSProperties = { width: size, height: size };

  if (isPhotoAvatar(avatar)) {
    return (
      <div className={`avatar-view avatar-view-photo ${className}`} style={{ ...style, borderColor: color }}>
        <img src={avatar} alt="" />
      </div>
    );
  }

  return (
    <div className={`avatar-view avatar-view-emoji ${className}`} style={{ ...style, backgroundColor: color }}>
      <span style={{ fontSize: size * 0.58 }}>{avatar || '❓'}</span>
    </div>
  );
}
