export interface Alert {
  id: string;
  location_id: string;
  commodity_id: string;
  evaluated_at: string;
  risk_score: number;
  severity: 'normal' | 'watch' | 'elevated' | 'critical';
  explanation: string;
  recommended_action: string;
  status: 'active' | 'resolved' | 'acknowledged';
  model_version: string;
  partial_signals: boolean;
  missing_signal_types: string;
  
  // Joined demo fields for easy display
  location_name: string;
  commodity_name: string;
}

export interface Signal {
  id: string;
  signal_type: 'price' | 'arrival' | 'satellite' | 'news' | 'consistency';
  raw_value: number | null;
  baseline_value: number | null;
  deviation: number | null;
  normalized_score: number | null;
  weight: number;
  sufficient_data: boolean;
  source_reference: string;
}
