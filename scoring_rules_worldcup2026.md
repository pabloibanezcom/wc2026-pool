# Technical Specifications: Scoring System - 2026 World Cup Predictor App

This document details the business rules for calculating points within the application. It serves as the foundation for backend service implementation and validation logic.

---

## 1. General Operational Rules

* **No Prediction:** If a user fails to save their prediction before the cutoff, they receive **0 points**.
* **Betting Cutoff (Lock):** Predictions are locked **15 minutes before** the official start of each match.
* **Initial Predictions:** The Honors Board, group positions, and individual awards must be finalized before the kickoff of the first match of the World Cup.
* **Official Results:** Points are calculated based on official FIFA data.

---

## 2. Match Scoring: Group Stage (72 matches)

Scoring is divided into two blocks: Outcome (Difficulty) and Score (Precision).

1.  **Match Outcome (1X2):**
    * Formula: `Outcome_Points = Round(Chosen_Result_Odds * 2)`
    * Use standard rounding (e.g., 2.5 -> 3; 2.4 -> 2).
2.  **Exact Score Bonus:**
    * If `User_Home_Goals == Real_Home_Goals` AND `User_Away_Goals == Real_Away_Goals`: **+5 points**.
3.  **Safety Cap:** 
    * A maximum of **20 points** per match (applied after totaling Outcome + Score points).

---

## 3. Match Scoring: Knockout Rounds (32 matches)

These rounds reward team progression and survival.

### A. "Who Advances" Block
Based on the "To Qualify" odds (includes extra time and penalties).
* **Formula:** `Round(Advancing_Odds * Round_Multiplier)`

| Round | Multiplier |
| :--- | :--- |
| Round of 32 | x2 |
| Round of 16 | x3 |
| Quarter-finals | x4 |
| 3rd and 4th Place | x4 |
| Semi-finals | x5 |
| Grand Final | x6 |

### B. "Exact Score Bonus" Block
Based on the result at the end of playtime (90' or 120' if extra time is played). **Penalty shootouts do not count** toward the exact score.

| Round | Bonus Points |
| :--- | :--- |
| Round of 32 | +6 pts |
| Round of 16 | +8 pts |
| Quarter-finals / 3rd Place | +10 pts |
| Semi-finals | +12 pts |
| Grand Final | +15 pts |

*Note: To earn the bonus in the event of a draw (e.g., 1-1), the user must select "Draw" as the score and then choose who advances using the "Who Advances" selector.*

---

## 4. Jokers 🃏

Each user has **2 Jokers** for the entire tournament:
1.  **Group Stage Joker:** Usable once between matches 1 and 72.
2.  **Knockout Stage Joker:** Usable once between matches 73 and 104.

* **Effect:** Multiplies the **total points** obtained in the selected match by **x2**.

---

## 5. Final Group Standings (12 groups)

Calculated at the conclusion of all group stage matches.

| Achievement | Points |
| :--- | :--- |
| Correct 1st Place | 8 pts |
| Correct 2nd Place | 6 pts |
| Correct 3rd Place | 3 pts |
| Correct 4th Place | 3 pts |
| **Perfect Group Bonus** (Exact 1-4 order) | **+5 pts** |
| **Consolation** (Qualifies in a different position) | 2 pts |

*Consolation applies if a team was predicted as 1st, 2nd, or 3rd and they qualify for the next round (Top 2 or best 3rd places), but not in the predicted position.

---

## 6. Honors Board and Individual Awards (Long-term)

### National Teams (Podium)
| Prediction | Real Result | Points |
| :--- | :--- | :--- |
| **Champion** | Finishes 1st | 40 pts |
| **Champion** | Finishes 2nd | 15 pts |
| **Runner-up** | Finishes 2nd | 25 pts |
| **Runner-up** | Finishes 1st | 15 pts |
| **Semi-finalist (x2)** | Finishes in Top 4 | 15 pts (each) |

### Individual Awards (Official FIFA)
* **Golden Boot:** 30 pts.
* **Golden Ball:** 30 pts.
* **Best Young Player:** 20 pts.

---

## 7. Tie-breaking Ranking Logic (Suggested)
In the event of a tie in total points:
1. Highest number of Exact Scores predicted correctly.
2. Highest number of Match Outcomes (1X2) predicted correctly.
3. Earliest App registration date.
