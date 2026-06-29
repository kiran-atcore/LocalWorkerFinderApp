# Replace NLP with AI-assisted querying using Groq

This plan outlines the steps to replace the current regex-based Natural Language Processing (NLP) search parser with an AI-assisted querying system powered by Groq. This will allow the system to intelligently interpret search parameters in real-time.

> [!WARNING]
> **API Key Required**: We will use the free Groq API to power this feature. You will need to provide a `GROQ_API_KEY`. Once approved, I will add this requirement to your `.env` file, and you will need to paste your key there for this feature to work!

## Open Questions
- Do you have a Groq API Key ready to place in the `backend/.env` file? If not, you can get one for free at `console.groq.com`.

## Proposed Changes

### Backend Dependencies
- Add `groq` to `backend/requirements.txt` and install it.

### `backend/core/nlp.py`
We will rewrite `parse_nl_query` to utilize the Groq API.
- We will prompt the `llama3-8b-8192` model (for maximum speed) to parse the natural language query.
- The model will return a strict JSON response containing `search_text`, `radius`, `max_rate`, `min_rate`, `min_experience`, and `min_rating`.
- We will provide it context of valid job categories so it maps relevant queries accurately.
- Fallback mechanisms will be included if the AI fails or parsing JSON fails, defaulting to extracting the base text.

### `frontend/src/app/(tabs)/home.tsx`
- We will capture all parsed parameters (`maxRate`, `minRate`, `minExp`, `minRating`, `radius`, `searchText`) from the AI backend accurately for **both** Customer Mode and Worker Mode.
- This ensures any mention of rate/experience filters instantly populates the local state and applies the UI filters dynamically in real-time.
- The search toggle logic mentioned (turning on/off automatically based on distance) will be verified and ensured.

### `frontend/src/app/CategoryList/[id].tsx`
- We will update the NLP parse effect to safely update the search parameters.
- **Critical Requirement**: We will ensure that the selected category remains locked. The parsed AI `search_text` will only filter *within* the currently active category, ignoring attempts to switch categories altogether.

### `frontend/src/app/RadarMap/[id].tsx`
- We will verify that the debounced AI parser accurately filters markers based on dynamically mentioned rates, distances, and ratings in both Worker and Job finding modes instantly.

## Verification Plan
### Automated Verification
- I will test the Groq API integration using a mock query in the Django shell to ensure JSON parsing works efficiently and rapidly.

### Manual Verification
- You will be asked to try typing queries like "jobs within 200km" or "Jobs with rate above 200" in the app search bars and verify they instantly toggle the respective filter controls without manual refreshing.
