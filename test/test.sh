export url=localhost:3000

gameid=$(http POST $url/v1/game | jq -r '.id')

http GET $url/v1/game/$gameid

cat <<EOF | http POST $url/v1/game/$gameid/players
{
    "game_id": "$gameid",
    "player_username": "smix"
}
EOF
http GET $url/v1/game/$gameid

cat <<EOF | http POST $url/v1/game/$gameid/players
{
    "game_id": "$gameid",
    "player_username": "kt"
}
EOF

http GET $url/v1/game/$gameid

cat <<EOF | http POST $url/v1/game/$gameid/players
{
    "game_id": "$gameid",
    "player_username": "Jerry"
}
EOF

http GET $url/v1/game/$gameid

cat <<EOF | http POST $url/v1/game/$gameid/start
{
    "game_id": "$gameid"
}
EOF

http GET $url/v1/game/$gameid

cat <<EOF | http POST localhost:3000/v1/game/$gameid/found_words
{
    "player_username": "smix",
    "coordinates": {
        "start": {"x":9, "y":5},
        "end": {"x":9, "y":9}
    }
}
EOF
