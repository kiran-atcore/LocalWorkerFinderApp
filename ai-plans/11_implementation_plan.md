# Upgrade Natural Language Parser (`nlp.py`)

The goal is to upgrade `backend/core/nlp.py` to be a highly robust intent parser capable of understanding a wide variety of edge cases, synonyms, and complex conversational queries.

## Proposed Upgrades to `parse_nl_query`

We will add regex patterns and logic to extract the following new and improved intents, while gracefully removing them from the raw text to yield a clean `search_text`.

### 1. Advanced Distance & Radius
- **Current:** "within X km", "near me"
- **New Additions:**
  - "close by", "nearby", "local" (defaults to 5km)
  - "no more than X km away", "less than X miles"
  - Handles miles (`m`, `mi`, `miles`) and converts to standard units if necessary (or just extracts the number).

### 2. Rate Ranges and Minimum Rates
- **Current:** "rate below X"
- **New Additions:**
  - **Min Rate (`min_rate`):** "rate above X", "min X", "starting from X", "> X"
  - **Rate Range:** "between X and Y", "$X - $Y", "X to Y"
  - **Budget Keywords:** "cheap", "affordable" (maps to `max_rate = 50`), "expensive", "premium" (maps to `min_rate = 100`)
  - Broadened matches for "bucks", "$", "dollars/hr".

### 3. Ratings / Quality (New Field: `min_rating`)
- **New Additions:**
  - "4 stars", "5 star rated", "rating > 4" (extracts `min_rating = 4`)
  - "top rated", "highly rated", "best" (defaults to `min_rating = 4.5`)

### 4. Advanced Experience Levels
- **Current:** "at least X years"
- **New Additions:**
  - "expert", "senior", "highly experienced", "master" (defaults to `min_experience = 5`)
  - "junior", "beginner", "apprentice" (could map to a new `max_experience = 2`, though we'll focus on `min_experience` and clean search text for now).

### 5. Smarter Text Cleaning (Filler Words)
- **New Additions:**
  - Broaden the filler word list: "can someone", "looking to hire", "i want a", "searching for", "please find", "is there a", etc.
  - Better whitespace and punctuation stripping (e.g., trailing "and" or commas).

## Output Schema Update
The API will now reliably return:
```json
{
  "search_text": "clean keywords",
  "radius": int | null,
  "max_rate": int | null,
  "min_rate": int | null,
  "min_experience": int | null,
  "min_rating": float | null
}
```

## User Review Required
> [!NOTE]
> This upgrade will make the backend parser incredibly smart. However, the frontend UI currently only has sliders for **Max Rate**, **Min Experience**, and **Radius**.
> 
> The backend will correctly parse `min_rate` and `min_rating`, but do you also want me to update the frontend (e.g., `CategoryListScreen` or `RadarMapPage`) to filter by these new fields locally, or should we just focus purely on upgrading the `nlp.py` logic for now as requested?
