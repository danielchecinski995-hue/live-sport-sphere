#!/bin/bash
# Seed 5 tournaments with teams, players, and matches
# Some matches completed, some scheduled (for referee mode)

API="https://live-sport-sphere-api-694574979605.europe-west1.run.app/api"

# Helper: create tournament, activate it, return ID
create_tournament() {
  local name="$1"
  local resp=$(curl -s -X POST "$API/tournaments" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$name\", \"format_type\": \"league\", \"config\": {\"points\": {\"win\": 3, \"draw\": 1, \"loss\": 0}}}")
  local id=$(echo "$resp" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  # Activate
  curl -s -X PATCH "$API/tournaments/$id/status" \
    -H "Content-Type: application/json" \
    -d '{"status": "active"}' > /dev/null
  echo "$id"
}

# Helper: create player, return ID
create_player() {
  local first="$1" last="$2"
  local resp=$(curl -s -X POST "$API/players" \
    -H "Content-Type: application/json" \
    -d "{\"first_name\": \"$first\", \"last_name\": \"$last\"}")
  echo "$resp" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

# Helper: create team with players, return team ID
create_team() {
  local tournament_id="$1" team_name="$2"
  shift 2
  local player_ids=("$@")

  local ids_json=""
  for pid in "${player_ids[@]}"; do
    [ -n "$ids_json" ] && ids_json="$ids_json,"
    ids_json="$ids_json\"$pid\""
  done

  local resp=$(curl -s -X POST "$API/tournaments/$tournament_id/teams" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$team_name\", \"player_ids\": [$ids_json]}")
  echo "$resp" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

echo "=== Seeding 5 tournaments ==="

# ============================================
# TOURNAMENT 1: Liga Orlika Gniezno 2025
# 4 teams, all matches scheduled (fresh for referee)
# ============================================
echo ""
echo "1/5 Liga Orlika Gniezno 2025..."
T1=$(create_tournament "Liga Orlika Gniezno 2025")
echo "  Tournament: $T1"

# Team 1: Sokol Gniezno
P=()
for pair in "Jan Kowalski" "Piotr Nowak" "Adam Wisniewski" "Tomasz Kaminski" "Marek Lewandowski" "Jakub Zielinski" "Filip Szymanski" "Kacper Wozniak" "Dawid Dabrowski" "Szymon Kozlowski" "Mateusz Jankowski"; do
  P+=($(create_player $pair))
done
T1_TEAM1=$(create_team "$T1" "Sokol Gniezno" "${P[@]}")
echo "  Team: Sokol Gniezno ($T1_TEAM1)"

# Team 2: Orzel Witkowo
P=()
for pair in "Krzysztof Wojcik" "Pawel Kowalczyk" "Michal Kaczmarek" "Lukasz Stepien" "Karol Gorski" "Marcel Rutkowski" "Oskar Michalak" "Wiktor Zajac" "Alan Krol" "Dominik Wrobel" "Antoni Dudek"; do
  P+=($(create_player $pair))
done
T1_TEAM2=$(create_team "$T1" "Orzel Witkowo" "${P[@]}")
echo "  Team: Orzel Witkowo ($T1_TEAM2)"

# Team 3: Warta Poznan U12
P=()
for pair in "Hubert Walczak" "Stanislaw Kubiak" "Mikolaj Maciejewski" "Aleksander Kaczmarczyk" "Gabriel Kalinowski" "Franciszek Mazurek" "Tymoteusz Adamski" "Julian Sobczak" "Ignacy Pietrzak" "Sebastian Gorecki" "Patryk Witkowski"; do
  P+=($(create_player $pair))
done
T1_TEAM3=$(create_team "$T1" "Warta Poznan U12" "${P[@]}")
echo "  Team: Warta Poznan U12 ($T1_TEAM3)"

# Team 4: Lech Gniezno
P=()
for pair in "Rafal Zieba" "Daniel Chmielewski" "Norbert Borkowski" "Emil Sadowski" "Artur Blaszczyk" "Robert Marciniak" "Grzegorz Urbanski" "Wojciech Glowacki" "Przemyslaw Sawicki" "Damian Kucharski" "Milosz Lis"; do
  P+=($(create_player $pair))
done
T1_TEAM4=$(create_team "$T1" "Lech Gniezno" "${P[@]}")
echo "  Team: Lech Gniezno ($T1_TEAM4)"

echo "  (All matches scheduled - ready for referee mode)"

# ============================================
# TOURNAMENT 2: Puchar Wielkopolski U14
# 4 teams, 2 matches completed, rest scheduled
# ============================================
echo ""
echo "2/5 Puchar Wielkopolski U14..."
T2=$(create_tournament "Puchar Wielkopolski U14")
echo "  Tournament: $T2"

P=()
for pair in "Oliwier Pawlak" "Igor Sikora" "Nikodem Baran" "Bartek Szewczyk" "Leon Kwiatkowski" "Bruno Holownia" "Tymon Wieczorek" "Maksymilian Pawlik" "Ryszard Zawadzki" "Andrzej Sikorski" "Maciej Bak"; do
  P+=($(create_player $pair))
done
T2_TEAM1=$(create_team "$T2" "Korona Kalisz U14" "${P[@]}")

P=()
for pair in "Henryk Czarnecki" "Leszek Malinowski" "Stefan Kolodziej" "Marcin Jasinski" "Dariusz Wrona" "Arkadiusz Kaczor" "Bogdan Kazmierczak" "Jerzy Wlodarczyk" "Zbigniew Zak" "Roman Duda" "Tadeusz Krajewski"; do
  P+=($(create_player $pair))
done
T2_TEAM2=$(create_team "$T2" "Olimpia Poznan U14" "${P[@]}")

P=()
for pair in "Cezary Nowicki" "Olaf Tomczak" "Natan Ostrowski" "Tobiasz Szczepanski" "Milosz Wasilewski" "Kamil Glowacki" "Konrad Sawicki" "Radoslaw Kucharski" "Bartlomiej Lis" "Sebastian Marciniak" "Patryk Urbanski"; do
  P+=($(create_player $pair))
done
T2_TEAM3=$(create_team "$T2" "Raków Konin U14" "${P[@]}")

P=()
for pair in "Julian Blaszczyk" "Ignacy Sadowski" "Franciszek Borkowski" "Gabriel Chmielewski" "Aleksander Zieba" "Tymoteusz Pietrzak" "Mikolaj Gorecki" "Stanislaw Adamski" "Hubert Sobczak" "Antoni Mazurek" "Leon Kalinowski"; do
  P+=($(create_player $pair))
done
T2_TEAM4=$(create_team "$T2" "Zaglebie Konin U14" "${P[@]}")

echo "  Teams created. (Mix of completed and scheduled)"

# ============================================
# TOURNAMENT 3: Turniej Wielkanocny 2025
# 3 teams, 1 match completed, 2 scheduled
# ============================================
echo ""
echo "3/5 Turniej Wielkanocny 2025..."
T3=$(create_tournament "Turniej Wielkanocny 2025")
echo "  Tournament: $T3"

P=()
for pair in "Jan Mazur" "Piotr Krawczyk" "Adam Piotrowicz" "Tomasz Grabowski" "Marek Kowalski" "Jakub Nowak" "Filip Wisniewski" "Kacper Kaminski" "Dawid Lewandowski" "Szymon Zielinski" "Mateusz Szymanski"; do
  P+=($(create_player $pair))
done
T3_TEAM1=$(create_team "$T3" "Juventus Gniezno" "${P[@]}")

P=()
for pair in "Krzysztof Wozniak" "Pawel Dabrowski" "Michal Kozlowski" "Lukasz Jankowski" "Karol Mazur" "Marcel Krawczyk" "Oskar Piotrowicz" "Wiktor Grabowski" "Alan Wojcik" "Dominik Kowalczyk" "Antoni Kaczmarek"; do
  P+=($(create_player $pair))
done
T3_TEAM2=$(create_team "$T3" "Real Trzemeszno" "${P[@]}")

P=()
for pair in "Hubert Stepien" "Stanislaw Gorski" "Mikolaj Rutkowski" "Aleksander Michalak" "Gabriel Zajac" "Franciszek Krol" "Tymoteusz Wrobel" "Julian Dudek" "Ignacy Pawlak" "Sebastian Sikora" "Patryk Baran"; do
  P+=($(create_player $pair))
done
T3_TEAM3=$(create_team "$T3" "Barcelona Czerniejewo" "${P[@]}")

echo "  Teams created. (Mostly scheduled)"

# ============================================
# TOURNAMENT 4: Liga Zimowa Gniezno
# 4 teams, 3 matches completed, 3 scheduled
# ============================================
echo ""
echo "4/5 Liga Zimowa Gniezno..."
T4=$(create_tournament "Liga Zimowa Gniezno")
echo "  Tournament: $T4"

P=()
for pair in "Rafal Szewczyk" "Daniel Kwiatkowski" "Norbert Holownia" "Emil Wieczorek" "Artur Pawlik" "Robert Zawadzki" "Grzegorz Sikorski" "Wojciech Bak" "Przemyslaw Czarnecki" "Damian Malinowski" "Milosz Kolodziej"; do
  P+=($(create_player $pair))
done
T4_TEAM1=$(create_team "$T4" "Gornik Gniezno" "${P[@]}")

P=()
for pair in "Ryszard Jasinski" "Andrzej Wrona" "Maciej Kaczor" "Henryk Kazmierczak" "Leszek Wlodarczyk" "Stefan Zak" "Marcin Duda" "Piotr Krajewski" "Dariusz Nowicki" "Arkadiusz Tomczak" "Bogdan Ostrowski"; do
  P+=($(create_player $pair))
done
T4_TEAM2=$(create_team "$T4" "Piast Klecko" "${P[@]}")

P=()
for pair in "Jerzy Szczepanski" "Zbigniew Wasilewski" "Roman Glowacki" "Tadeusz Sawicki" "Cezary Kucharski" "Olaf Lis" "Natan Marciniak" "Tobiasz Urbanski" "Kamil Blaszczyk" "Konrad Sadowski" "Radoslaw Borkowski"; do
  P+=($(create_player $pair))
done
T4_TEAM3=$(create_team "$T4" "Stal Niechanowo" "${P[@]}")

P=()
for pair in "Bartlomiej Chmielewski" "Sebastian Zieba" "Patryk Pietrzak" "Julian Gorecki" "Ignacy Adamski" "Franciszek Sobczak" "Gabriel Mazurek" "Aleksander Kalinowski" "Tymoteusz Walczak" "Mikolaj Kubiak" "Stanislaw Maciejewski"; do
  P+=($(create_player $pair))
done
T4_TEAM4=$(create_team "$T4" "Zaglebie Witkowo" "${P[@]}")

echo "  Teams created. (Half completed, half scheduled)"

# ============================================
# TOURNAMENT 5: Mistrzostwa Powiatu 2025
# 5 teams, mostly scheduled
# ============================================
echo ""
echo "5/5 Mistrzostwa Powiatu 2025..."
T5=$(create_tournament "Mistrzostwa Powiatu 2025")
echo "  Tournament: $T5"

P=()
for pair in "Jan Walczak" "Piotr Kubiak" "Adam Maciejewski" "Tomasz Kaczmarczyk" "Marek Kalinowski" "Jakub Mazurek" "Filip Adamski" "Kacper Sobczak" "Dawid Pietrzak" "Szymon Gorecki" "Mateusz Witkowski"; do
  P+=($(create_player $pair))
done
T5_TEAM1=$(create_team "$T5" "Sparta Gniezno" "${P[@]}")

P=()
for pair in "Krzysztof Zieba" "Pawel Chmielewski" "Michal Borkowski" "Lukasz Sadowski" "Karol Blaszczyk" "Marcel Marciniak" "Oskar Urbanski" "Wiktor Glowacki" "Alan Sawicki" "Dominik Kucharski" "Antoni Lis"; do
  P+=($(create_player $pair))
done
T5_TEAM2=$(create_team "$T5" "Wicher Czerniejewo" "${P[@]}")

P=()
for pair in "Hubert Wasilewski" "Stanislaw Szczepanski" "Mikolaj Ostrowski" "Aleksander Tomczak" "Gabriel Zawadzki" "Franciszek Sikorski" "Tymoteusz Bak" "Julian Czarnecki" "Ignacy Malinowski" "Sebastian Kolodziej" "Patryk Jasinski"; do
  P+=($(create_player $pair))
done
T5_TEAM3=$(create_team "$T5" "Huragan Klecko" "${P[@]}")

P=()
for pair in "Rafal Wrona" "Daniel Kaczor" "Norbert Kazmierczak" "Emil Wlodarczyk" "Artur Zak" "Robert Duda" "Grzegorz Krajewski" "Wojciech Nowicki" "Przemyslaw Tomczak" "Damian Ostrowski" "Milosz Szczepanski"; do
  P+=($(create_player $pair))
done
T5_TEAM4=$(create_team "$T5" "Promien Witkowo" "${P[@]}")

P=()
for pair in "Ryszard Wasilewski" "Andrzej Glowacki" "Maciej Sawicki" "Henryk Kucharski" "Leszek Lis" "Stefan Marciniak" "Marcin Urbanski" "Piotr Blaszczyk" "Dariusz Sadowski" "Arkadiusz Borkowski" "Bogdan Chmielewski"; do
  P+=($(create_player $pair))
done
T5_TEAM5=$(create_team "$T5" "Orkan Trzemeszno" "${P[@]}")

echo "  Teams created. (All matches scheduled - fresh tournament)"

echo ""
echo "=== DONE! 5 tournaments created ==="
echo "All tournaments are active with scheduled matches."
echo "Go to Referee Mode to start matches!"
