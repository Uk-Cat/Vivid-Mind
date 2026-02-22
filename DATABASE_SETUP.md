# Database Setup Instructions

## Required Database Column

Before using the edit, delete, and publicize features, you need to add a `Public` column to your `Flashcards` table in Supabase.

### SQL Command to Add Public Column

```sql
ALTER TABLE Flashcards
ADD COLUMN Public BOOLEAN DEFAULT false;
```

### Steps in Supabase Dashboard:

1. Go to your Supabase project
2. Navigate to the SQL Editor
3. Run the SQL command above
4. OR manually add the column:
   - Go to the `Flashcards` table
   - Click "Add Column"
   - Name: `Public`
   - Type: `boolean`
   - Default value: `false`

## Features Now Available

Once the `Public` column is added, you'll have access to:

### For Your Flashcard Sets:
- **🔒 Toggle Public/Private**: Click the lock icon next to any set name to publicize it (makes it visible to other users)
- **🗑️ Delete Sets**: Delete entire flashcard sets with one click (includes all associated cards and images)
- **✏️ Edit Cards**: Edit individual cards to change the front/back text and images
- **🗑️ Delete Cards**: Remove individual cards from a set without deleting the entire set

### How to Use:

1. **View Your Sets**: All your flashcard sets appear on the dashboard with control buttons
2. **Set Controls** (next to each set title):
   - 🌍 or 🔒 icon: Toggle between public and private
   - 🗑️ icon: Delete the entire set
3. **Card Controls** (appear when you hover over a card):
   - ✏️ icon: Edit the card
   - 🗑️ icon: Delete the card

## Database Structure

Your `Flashcards` table will now have:
- `id`: UUID (primary key)
- `Email`: Text (user email)
- `Set_name`: Text (flashcard set name)
- `Cards`: JSONB (array of card objects with id, front, back, frontImage, backImage)
- `Public`: Boolean (whether the set is public or private)
- `created_at`: Timestamp (auto-generated)
- `updated_at`: Timestamp (auto-updated)

**Note**: The `Public` column should default to `false` for all new sets created.
