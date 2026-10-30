import React from 'react';
import {cardRegistry} from '../cards/registry';
import type {Theme} from './schema';

export type CardRendererProps = {
  cardId: string;
  params?: Record<string, unknown>;
  theme: Theme;
  durationInFrames: number;
  children?: React.ReactNode;
};

export const CardRenderer: React.FC<CardRendererProps> = ({
  cardId,
  params = {},
  theme,
  durationInFrames,
  children,
}) => {
  const card = cardRegistry.get(cardId);
  if (!card) {
    throw new Error(`Motion card is not registered: ${cardId}`);
  }
  return <card.Component {...params} theme={theme} durationInFrames={durationInFrames}>{children}</card.Component>;
};
