export type TopicStatus = 'not_started' | 'in_progress' | 'complete' | 'needs_review'
export type DepthLevel = 0 | 1 | 2 | 3 | 4
export type NoteType = 'concept' | 'code' | 'lab' | 'interview' | 'resource'
export type ProjectStatus = 'not_started' | 'planning' | 'in_progress' | 'complete' | 'polished'
export type ChatMode = 'teaching' | 'code_review' | 'interview' | 'debug' | 'checkin'
export type ResourceStatus = 'not_started' | 'reading' | 'complete'
export type AIPersonality = 'mentor' | 'casual'

export interface Profile {
  id: string
  display_name: string | null
  current_phase: number
  study_goal_hours_per_week: number
  ai_personality: AIPersonality
  created_at: string
}

export interface TopicProgress {
  id: string
  user_id: string
  phase: number
  topic_key: string
  status: TopicStatus
  depth_level: DepthLevel
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  topic_key: string | null
  phase: number | null
  tags: string[]
  note_type: NoteType
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  mode: ChatMode
  topic_key: string | null
  created_at: string
}

export interface ChatConversation {
  id: string
  user_id: string
  title: string
  mode: ChatMode
  topic_key: string | null
  message_count: number
  created_at: string
  updated_at: string
}

export interface Milestone {
  title: string
  completed: boolean
}

export interface Project {
  id: string
  user_id: string
  project_key: string
  status: ProjectStatus
  github_url: string | null
  notes: string | null
  milestones: Milestone[]
  resume_talking_points: string | null
  updated_at: string
}

export interface SkillAssessment {
  id: string
  user_id: string
  skill_key: string
  level: DepthLevel
  assessed_at: string
}

export interface StudySession {
  id: string
  user_id: string
  date: string
  duration_minutes: number
  topics: string[]
  notes: string | null
  energy_level: number
  created_at: string
}

export interface Resource {
  id: string
  user_id: string
  title: string
  url: string
  category: string
  priority: string
  is_free: boolean
  status: ResourceStatus
  notes: string | null
  topic_key: string | null
  is_custom: boolean
  created_at: string
}

// Curriculum data types
export interface CurriculumLab {
  key: string
  title: string
  description: string
  resources: CurriculumResource[]
}

export type ResourceType = 'video' | 'article' | 'course' | 'docs' | 'book' | 'tool' | 'practice' | 'repo'
export type ResourcePriority = 'must' | 'recommended' | 'optional'

export interface CurriculumResource {
  title: string
  url: string
  type: ResourceType
  isFree: boolean
  priority: ResourcePriority
  note?: string // one-line context: "best free Python security course", "hands-on labs", etc.
}

export interface CurriculumTopic {
  key: string
  title: string
  description: string
  tools: string[]
  whyItMatters: string
  resources: CurriculumResource[]
}

export interface CurriculumPhase {
  phase: number
  title: string
  goal: string
  weeks: string
  topics: CurriculumTopic[]
  labs: CurriculumLab[]
}

export interface SkillCategory {
  key: string
  title: string
  phase: number
}

export interface PortfolioProject {
  key: string
  title: string
  description: string
  milestones: string[]
  resumeTalkingPoints: string
  skills: string[]
}
