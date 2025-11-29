-- AlterTable: Add ON DELETE CASCADE to RecipeIngredient recipeId foreign key
-- This allows deleting a Recipe and automatically deleting its RecipeIngredient records

-- DropForeignKey
ALTER TABLE "RecipeIngredient" DROP CONSTRAINT IF EXISTS "RecipeIngredient_recipeId_fkey";

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

