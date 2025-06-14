import { eq } from "drizzle-orm";
import { db } from "../db";
import { rubrics, type Rubric, rubricCriteria, type RubricCriterion } from "../schema/rubrics";
import { users, type User } from "../schema/users"; // For creator details

// Re-export types
export type { Rubric, RubricCriterion, User };

export type RubricWithRelations = Rubric & {
  creator?: User | null;
  criteria?: RubricCriterion[];
};

/**
 * Retrieves all rubrics.
 * @returns A list of all rubrics, optionally including creator and criteria.
 */
export async function getAllRubrics(): Promise<RubricWithRelations[]> {
  // For simplicity, this first version fetches rubrics and their creators.
  // Criteria for each rubric would require N+1 queries or a more complex aggregation.
  // A common pattern is to fetch criteria separately when a specific rubric is selected.
  const rubricsList = await db
    .select({
      id: rubrics.id,
      name: rubrics.name,
      description: rubrics.description,
      creatorId: rubrics.creatorId,
      maxScore: rubrics.maxScore,
      createdAt: rubrics.createdAt,
      updatedAt: rubrics.updatedAt,
      creator: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
      },
    })
    .from(rubrics)
    .leftJoin(users, eq(rubrics.creatorId, users.id));

  // To attach criteria, you could loop and query, or use a more advanced SQL technique.
  // For now, returning without criteria in the list view for simplicity.
  // The island can fetch criteria when a rubric is selected for a milestone.
  return rubricsList.map(r => ({
      ...r,
      creator: r.creator?.id ? r.creator : null, // Ensure creator object is null if no ID (though join might handle this)
      criteria: [], // Placeholder, criteria not fetched here for performance in a list
  }));
}

/**
 * Retrieves a specific rubric by its ID, including its criteria and creator.
 * @param rubricId The ID of the rubric.
 * @returns The rubric with its details, or undefined if not found.
 */
export async function getRubricById(rubricId: number): Promise<RubricWithRelations | undefined> {
    const rubricResult = await db
        .select({
            id: rubrics.id,
            name: rubrics.name,
            description: rubrics.description,
            creatorId: rubrics.creatorId,
            maxScore: rubrics.maxScore,
            createdAt: rubrics.createdAt,
            updatedAt: rubrics.updatedAt,
            creator: {
                id: users.id,
                fullName: users.fullName,
                email: users.email,
            },
        })
        .from(rubrics)
        .leftJoin(users, eq(rubrics.creatorId, users.id))
        .where(eq(rubrics.id, rubricId))
        .limit(1);

    if (rubricResult.length === 0) {
        return undefined;
    }

    const rubricData = rubricResult[0];

    const criteriaResult = await db
        .select()
        .from(rubricCriteria)
        .where(eq(rubricCriteria.rubricId, rubricId));

    return {
        ...rubricData,
        creator: rubricData.creator?.id ? rubricData.creator : null,
        criteria: criteriaResult,
    };
}

// Add other rubric-related functions here:
// - createRubric(data: NewRubric, criteria: NewRubricCriterion[])
// - updateRubric(rubricId: number, data: Partial<NewRubric>, criteria: Partial<NewRubricCriterion>[])
// - deleteRubric(rubricId: number)
