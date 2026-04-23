import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';

const EMOJI_FALLBACK: Record<string, string> = {
  SER: '🇷🇸',
  ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
};

interface FlagProps {
  code: string;
  size?: number;
}

export default function Flag({ code, size = 28 }: FlagProps) {
  const [err, setErr] = useState(false);

  if (err) {
    return (
      <View style={{ width: size, height: size * 0.67, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.6 }}>{EMOJI_FALLBACK[code] || '🏳️'}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: `https://play.fifa.com/media/image/bracket_predictor/flags/world_cup_2026/${code}.png` }}
      style={{ width: size, height: size * 0.67, resizeMode: 'contain' }}
      onError={() => setErr(true)}
    />
  );
}
