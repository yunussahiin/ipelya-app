// KYC Data Table Types

export interface KYCCreator {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface KYCApplication {
  id: string;
  creator_id: string;
  level: "basic" | "full";
  status: "pending" | "approved" | "rejected";
  first_name: string;
  last_name: string;
  birth_date: string | null;
  id_number: string | null;
  auto_score: number | null;
  auto_recommendation: string | null;
  ocr_form_match: boolean | null;
  face_detection_passed: boolean | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  creator?: KYCCreator | null;
}

// Kullanıcı bazlı gruplandırılmış veri
export interface KYCUserGroup {
  creator_id: string;
  creator: KYCCreator | null;
  applications: KYCApplication[];
  latestApplication: KYCApplication;
  totalApplications: number;
  hasApproved: boolean;
  hasPending: boolean;
  hasRejected: boolean;
}
