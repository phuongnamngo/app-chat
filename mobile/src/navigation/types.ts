import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types';

export type { RootStackParamList };

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList, S>;
