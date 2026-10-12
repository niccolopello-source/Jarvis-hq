#!/bin/bash
# usage: run.sh <worktree> <tag>
W=$1; T=$2; cd $W/apps/pivot23
for c in 0 1000 2000 3000; do echo "pro $c 1000"; done > /tmp/jobs-$T
for d in esordio allstar leggenda; do echo "$d 0 1000"; done >> /tmp/jobs-$T
cat /tmp/jobs-$T | xargs -P 4 -L 1 bash -c 'node --import=tsx scripts/g4/collect.ts $0 $1 $2 /workspace/reports/g4/raw/'$T'-$0-$1.jsonl' 
