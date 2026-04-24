# Updates for v1.2
## Propose a lineup functionality
When you edit a match and there is no line up, add a button for generate line up

For now, it should only worry about 9v9 format and 4 types of formation (always assuming there is the goal keeper):
- 3-4-1
- 3-1-3-1
- 4-3-1
- 3-3-2


You should then confirm who is playing to understand the number of players. Against a player, you should also be able  optionally specify if they are "carrying an injury" or "reduced time" 

This should use claude sonnet via api to look into all the data about the team from supabase. Corolate players to their stronger positions and ones where they play a higher frequency.

Use the statistics to support the position they are in. Defensive players is about clean quarters, attacking players is about assists and goals.

All players MUST play AT LEAST half a match. If they are carrying an injury, prioritise not to start. If they are marked as reduced time, then cap to half match.

Break down any substitutions to fit in 1/8 segments as per the UI.

Provide a team-knowledge.md file to support the prompt to Claude that can be used to support the plan. 
