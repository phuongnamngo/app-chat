import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

/**
 * Custom tab bar that does not use @react-navigation/elements (Badge/MissingIcon
 * can be undefined with some package versions). Uses only React Native primitives.
 */
export function CustomTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const { bottom: insetBottom } = useSafeAreaInsets();
  const bottomInset = insets?.bottom ?? insetBottom;

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={
                typeof label === 'string' ? label : options.tabBarAccessibilityLabel
              }
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tab, focused && styles.tabFocused]}
            >
              <Text
                style={[
                  styles.label,
                  { color: focused ? '#007AFF' : '#8E8E93' },
                  options.tabBarLabelStyle,
                ]}
                numberOfLines={1}
              >
                {typeof label === 'string' ? label : route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9F9F9',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C7C7CC',
  },
  tabs: {
    flexDirection: 'row',
    height: 49,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabFocused: {},
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
