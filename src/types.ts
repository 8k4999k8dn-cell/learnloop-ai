export type ViewMode = 'home' | 'learning' | 'quiz' | 'feedback' | 'reinforcement'

export interface FiveMinSummary {
  definition: string
  key_points: string[]
  example: string
}

export interface HighFrequencyPoint {
  point: string
  explanation: string
}

export interface LearningCard {
  topic: string
  five_min_summary: FiveMinSummary
  high_frequency_points: HighFrequencyPoint[]
  recitation_version: string
}

export interface WordExplanation {
  selected_text: string
  simpler_explanation: string
  example: string
  common_confusion: string
  follow_ups: string[]
}

export interface Question {
  type: 'short_answer' | 'single_choice'
  question: string
  options?: string[]
  correct_option?: string
  reference_answer: string
  scoring_points?: string[]
}

export interface QuestionFeedback {
  question: string
  result: 'correct' | 'partial' | 'incorrect'
  strengths: string
  missing_points: string
  correction: string
}

export interface TestFeedback {
  overall_feedback: string
  per_question_feedback: QuestionFeedback[]
  weak_points: string[]
}

export interface ReinforcementCard {
  mastered_points: string[]
  weak_points: string[]
  reinforcement_summary: string
  common_mistakes: string[]
  revised_recitation_version: string
}
