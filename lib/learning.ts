export type DataRecord = Record<string, unknown>;

export type LearningLesson = {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  xpReward: number;
  estimatedMinutes: number;
  prerequisites: string[];
  learningObjectives: string[];
  skillTags: string[];
};

export type LearningModule = {
  id: string;
  name: string;
  status: string;
  lessons: LearningLesson[];
};

export type LearningPhase = {
  id: string;
  name: string;
  description: string;
  status: string;
  estimatedHours: number;
  modules: LearningModule[];
};

export type LearningRoadmap = {
  id: string;
  title: string;
  goal: string;
  status: string;
  progressPercent: number;
  lessonsCompleted: number;
  phases: LearningPhase[];
};

export function asRecord(value: unknown): DataRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as DataRecord)
    : {};
}

export function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function textList(value: unknown): string[] {
  return asList(value).filter(
    (item): item is string => typeof item === "string",
  );
}

export function normalizeLesson(value: unknown): LearningLesson {
  const lesson = asRecord(value);
  return {
    id: asText(lesson.id),
    name: asText(lesson.name || lesson.title, "Lesson"),
    description: asText(lesson.description),
    type: asText(lesson.type, "learn"),
    status: asText(lesson.status, "locked").toLowerCase(),
    xpReward: asNumber(lesson.xpReward ?? lesson.xp_reward),
    estimatedMinutes: asNumber(
      lesson.estimatedMinutes ??
        lesson.estimatedTime ??
        lesson.estimated_minutes,
      15,
    ),
    prerequisites: textList(lesson.prerequisites),
    learningObjectives: textList(
      lesson.learningObjectives ?? lesson.objectives,
    ),
    skillTags: textList(lesson.skillTags ?? lesson.skill_tags),
  };
}

function normalizeModule(
  value: unknown,
  phaseId: string,
  index: number,
): LearningModule {
  const module = asRecord(value);
  const rawLessons = asList(module.lessons ?? module.topics);
  return {
    id: asText(module.id, `${phaseId}-module-${index + 1}`),
    name: asText(module.name ?? module.title, `Module ${index + 1}`),
    status: asText(module.status, "current").toLowerCase(),
    lessons: rawLessons.map(normalizeLesson),
  };
}

function normalizePhase(value: unknown, index: number): LearningPhase {
  const phase = asRecord(value);
  const id = asText(phase.id, `phase-${index + 1}`);
  const rawModules = asList(phase.levels ?? phase.modules);
  return {
    id,
    name: asText(phase.name ?? phase.title, `Phase ${index + 1}`),
    description: asText(phase.description),
    status: asText(phase.status, "current").toLowerCase(),
    estimatedHours: asNumber(phase.estimatedHours ?? phase.estimated_hours),
    modules: rawModules.map((module, moduleIndex) =>
      normalizeModule(module, id, moduleIndex),
    ),
  };
}

export function normalizeRoadmap(value: unknown): LearningRoadmap {
  const roadmap = asRecord(value);
  const phases = asList(roadmap.phases).map(normalizePhase);
  const progress = asNumber(
    roadmap.progressPercent ?? roadmap.progress_percent,
  );
  return {
    id: asText(roadmap.id),
    title: asText(roadmap.title ?? roadmap.goal, "Learning path"),
    goal: asText(roadmap.goal),
    status: asText(roadmap.status, "current").toLowerCase(),
    progressPercent: Math.max(0, Math.min(100, progress)),
    lessonsCompleted: asNumber(
      roadmap.lessonsCompleted ?? roadmap.lessons_completed,
    ),
    phases,
  };
}

export function flattenLessons(
  roadmap: LearningRoadmap,
): (LearningLesson & { phaseId: string; moduleId: string })[] {
  return roadmap.phases.flatMap((phase) =>
    phase.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        ...lesson,
        phaseId: phase.id,
        moduleId: module.id,
      })),
    ),
  );
}
