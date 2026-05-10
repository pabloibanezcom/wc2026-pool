import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts } from '../theme';
import { useI18n } from '../i18n';

export const PICK_TABS = ['upcoming', 'results', 'groups', 'finals'] as const;
export type PicksTab = typeof PICK_TABS[number];

interface PicksTabsProps {
  tab: PicksTab;
  onChange: (tab: PicksTab) => void;
}

export default function PicksTabs({ tab, onChange }: PicksTabsProps) {
  const { t } = useI18n();
  const tabAnimation = useRef(new Animated.Value(PICK_TABS.indexOf(tab))).current;
  const [tabBarWidth, setTabBarWidth] = useState(0);

  useEffect(() => {
    Animated.spring(tabAnimation, {
      toValue: PICK_TABS.indexOf(tab),
      useNativeDriver: true,
      speed: 22,
      bounciness: 4,
    }).start();
  }, [tab, tabAnimation]);

  const tabIndicatorWidth = tabBarWidth > 0 ? (tabBarWidth - 8) / PICK_TABS.length : 0;
  const tabIndicatorTranslate = tabAnimation.interpolate({
    inputRange: PICK_TABS.map((_, index) => index),
    outputRange: PICK_TABS.map((_, index) => index * tabIndicatorWidth),
  });

  return (
    <View
      style={styles.tabBar}
      onLayout={(event) => setTabBarWidth(event.nativeEvent.layout.width)}
    >
      {tabIndicatorWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabIndicator,
            {
              width: tabIndicatorWidth,
              transform: [{ translateX: tabIndicatorTranslate }],
            },
          ]}
        />
      )}

      {PICK_TABS.map((tabKey) => {
        const active = tab === tabKey;
        return (
          <TouchableOpacity
            key={tabKey}
            style={styles.tab}
            onPress={() => onChange(tabKey)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tabKey === 'upcoming'
                ? t('picks.upcoming')
                : tabKey === 'results'
                ? t('picks.results')
                : tabKey === 'groups'
                ? t('picks.groups')
                : t('picks.finals')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    bottom: 4,
    left: 4,
    position: 'absolute',
    top: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: '600', fontFamily: fonts.bodyMedium },
  tabTextActive: { color: '#fff' },
});
