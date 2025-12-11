
import React from 'react';
import {
  AlertTriangle,
  Lightbulb,
  Users,
  LineChart,
  Link,
  DollarSign,
  Coins,
  Shield,
} from 'lucide-react';

// Custom icons for the Lean Canvas
export const ProblemIcon = (props: React.ComponentProps<typeof AlertTriangle>) => (
  <AlertTriangle {...props} />
);

export const SolutionIcon = (props: React.ComponentProps<typeof Lightbulb>) => (
  <Lightbulb {...props} />
);

export const CustomerSegmentsIcon = (props: React.ComponentProps<typeof Users>) => (
  <Users {...props} />
);

export const KeyMetricsIcon = (props: React.ComponentProps<typeof LineChart>) => (
  <LineChart {...props} />
);

export const ChannelsIcon = (props: React.ComponentProps<typeof Link>) => (
  <Link {...props} />
);

export const CostStructureIcon = (props: React.ComponentProps<typeof DollarSign>) => (
  <DollarSign {...props} />
);

export const RevenueStreamsIcon = (props: React.ComponentProps<typeof Coins>) => (
  <Coins {...props} />
);

export const UnfairAdvantageIcon = (props: React.ComponentProps<typeof Shield>) => (
  <Shield {...props} />
);
