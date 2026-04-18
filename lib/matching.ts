import { Profile, Job } from "./types";

export interface MatchAnalysis {
  score: number; // 0 to 100
  strengths: string[];
  gaps: string[];
  roadmap: string[];
}

export function generateMatchAnalysis(profile: Profile | null, job: Job): MatchAnalysis {
  if (!profile) {
    return {
      score: 0,
      strengths: [],
      gaps: job.requirements,
      roadmap: ["Complete your profile by adding skills and experience to get a match analysis."],
    };
  }

  // 1. Prepare data
  const userSkills = profile.skills.map((s) => s.toLowerCase());
  const userExperienceText = profile.experience
    .map((e) => `${e.title} ${e.description}`)
    .join(" ")
    .toLowerCase();
  
  const jobRequirements = job.requirements.map((r) => r.toLowerCase());

  // 2. Analyze matching skills (Strengths vs Gaps)
  const strengths: string[] = [];
  const gaps: string[] = [];

  job.requirements.forEach((req, index) => {
    const reqLower = jobRequirements[index];
    // Check if the requirement exists exactly in skills OR is mentioned in experience/bio
    const inSkills = userSkills.some((s) => reqLower.includes(s) || s.includes(reqLower));
    const inExperience = userExperienceText.includes(reqLower);

    if (inSkills || inExperience) {
      strengths.push(req);
    } else {
      gaps.push(req);
    }
  });

  // 3. Calculate Score
  let score = 0;
  if (job.requirements.length > 0) {
    score = Math.round((strengths.length / job.requirements.length) * 100);
  } else {
    score = 100; // If no requirements, perfect match by default
  }

  // Bonus points for experience level match (simple heuristic)
  if (job.experienceLevel === "Senior" && profile.experience.length >= 3) {
    score = Math.min(100, score + 10);
  }

  // 4. Generate Actionable Roadmap
  const roadmap: string[] = [];
  if (gaps.length > 0) {
    roadmap.push(`Focus on learning the missing core skills: ${gaps.slice(0, 3).join(", ")}.`);
    roadmap.push("Build a personal project that demonstrates your ability in these areas.");
    if (gaps.length > 3) {
      roadmap.push("Consider taking online certifications to rapidly close the remaining skill gaps.");
    }
  } else {
    roadmap.push("Your profile is a perfect technical fit! Make sure your resume highlights these strengths.");
    roadmap.push("Prepare for behavioral interviews focusing on your past project impacts.");
  }

  return {
    score,
    strengths,
    gaps,
    roadmap,
  };
}
