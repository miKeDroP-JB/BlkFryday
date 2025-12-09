#!/bin/bash
cd /home/user/BlkFryday/system/arc/raw

# List of 53 ARC training tasks
TASKS=(
  "007bbfb7" "00d62c1b" "017c7c7b" "025d127b" "045e512c" "0520fde7" "05269061" "05f2a901" "06df4c85" "08ed6ac7"
  "09629e4f" "0962bcdd" "0b148d64" "0ca9ddb6" "0d3d703e" "0dfd9992" "0e206a2e" "10fcaaa3" "11852cab" "1190e5a7"
  "137eaa0f" "150deff5" "178fcbfb" "1a07d186" "1b2d62fb" "1b60fb0c" "1bfc4729" "1c786137" "1caeab9d" "1cf80156"
  "1e0a9b12" "1e32b0e9" "1f0c79e5" "1f642eb9" "1f85a75f" "1f876c06" "1fad071e" "2013d3e2" "2204b7a8" "22168020"
  "22233c11" "2281f1f4" "228f6490" "22eb0ac0" "234bbc79" "23581191" "239be575" "23b5c85d" "253bf280" "25d487eb"
  "25d8a9c8" "25ff71a9" "264363fd"
)

for task in "${TASKS[@]}"; do
  if [ ! -f "${task}.json" ]; then
    curl -sL "https://raw.githubusercontent.com/fchollet/ARC-AGI/master/data/training/${task}.json" -o "${task}.json"
    echo "Downloaded ${task}"
  fi
done

echo "Done. Total files: $(ls *.json 2>/dev/null | wc -l)"
